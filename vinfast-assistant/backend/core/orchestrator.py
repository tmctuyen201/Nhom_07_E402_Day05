"""Main orchestrator: safety → RAG retrieve → LLM synthesize."""
import re
import logging
from typing import Optional

from .types import SynthesisResult
from .safety import check as safety_check
from .prompts import OFF_TOPIC_MSG, LOW_CONTEXT_MSG
from ..rag.db import retrieve_from_db
from ..config import LLM_PROVIDER

logger = logging.getLogger("vinfast")

# Queries that don't need RAG — go straight to LLM
_CONVERSATIONAL = re.compile(
    r"^(xin\s*chào|hello|hi|hey|chào|alo|good\s*(morning|afternoon|evening)|"
    r"bạn\s*(có thể|ơi|là)|cảm\s*ơn|thank|ok|okay|được\s*rồi|"
    r"tôi\s*(muốn|cần|có thể)|giúp\s*(tôi|mình)|bắt\s*đầu|"
    r"mình\s*(cần|muốn)|cho\s*tôi\s*biết|bạn\s*làm\s*được\s*gì)[^a-z]*$",
    re.I | re.UNICODE,
)

_PLACE_SEARCH = re.compile(
    r"(tìm|kiếm|gợi ý|recommend|find|search|nearby|gần\s*(đây|tôi))\s*"
    r".*(quán|nhà hàng|cà phê|coffee|ăn|food|store|cửa hàng|siêu thị|atm|bệnh viện|"
    r"pharmacy|thuốc|xăng|petrol|hotel|khách sạn|bar|pub|gym|spa|cinema|rạp)",
    re.I | re.UNICODE,
)

_DIRECTIONS = re.compile(
    r"(chỉ\s*đường|dẫn\s*đường|đường\s*đến|navigate|directions?\s*to|đi\s*đến|"
    r"làm\s*sao\s*đến|cách\s*đến|tới\s+\w)",
    re.I | re.UNICODE,
)


def _is_conversational(query: str) -> bool:
    q = query.strip()
    if _CONVERSATIONAL.match(q):
        return True
    # Place search and directions bypass RAG too
    if _PLACE_SEARCH.search(q) or _DIRECTIONS.search(q):
        return True
    words = q.split()
    if len(words) <= 5 and not any(
        kw in q.lower() for kw in ["pin", "sạc", "đèn", "lốp", "phanh", "adas", "km", "bảo dưỡng"]
    ):
        return True
    return False


async def run_orchestrator(
    query: str,
    car_model: str = "VF8",
    image_data: Optional[str] = None,
    conversation_history: Optional[list[dict]] = None,
    api_key: str = "",
    session_id: str = "default",
    user_profile: Optional[dict] = None,
) -> SynthesisResult:
    history = conversation_history or []

    # 1. Safety
    safety = safety_check(query, session_id)
    if not safety.is_safe:
        logger.warning(f"[{session_id}] Blocked: {safety.reason or 'off-topic'}")
        return SynthesisResult(
            answer=safety.reason or OFF_TOPIC_MSG,
            sources=[], confidence=0.0, car_model=car_model,
        )

    # 2. RAG retrieve — skip for pure conversational queries
    if _is_conversational(query):
        logger.info(f"[{session_id}] Conversational query — skipping RAG")
        chunks = []
    else:
        chunks = retrieve_from_db(query, car_model=car_model, top_k=5, threshold=0.05)
        if not chunks:
            logger.warning(f"[{session_id}] No chunks retrieved")
            return SynthesisResult(
                answer=LOW_CONTEXT_MSG, sources=[], confidence=0.0, car_model=car_model,
            )
        logger.info(f"[{session_id}] {len(chunks)} chunks (top={chunks[0][1]:.3f})")

    # 3. LLM synthesize
    if LLM_PROVIDER == "anthropic":
        from ..llm.anthropic import synthesize
    else:
        from ..llm.openai import synthesize

    try:
        result = await synthesize(
            query=query,
            context_chunks=chunks,
            car_model=car_model,
            conversation_history=history,
            api_key=api_key,
            user_profile=user_profile,
        )
        logger.info(f"[{session_id}] Done conf={result.confidence:.2f} cat={result.category}")
        return result
    except Exception as e:
        logger.error(f"[{session_id}] Synthesize error: {e}")
        return SynthesisResult(answer=f"Lỗi: {e}", sources=[], confidence=0.0, car_model=car_model)
