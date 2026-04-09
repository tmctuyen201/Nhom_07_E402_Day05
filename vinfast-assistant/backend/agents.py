"""
Safety + Orchestrator agents.
"""
import logging
import time
import re
from dataclasses import dataclass
from .synthesizer_types import RetrievedChunk, SynthesisResult
from .embeddings import retrieve
from .synthesizer import synthesize
from .knowledge_base import KNOWLEDGE_BASE

logger = logging.getLogger("vinfast")

# ── Safety Agent ──────────────────────────────────────────────
OFF_TOPIC_PATTERNS = [
    re.compile(p, re.I) for p in [
        r"\b(medical|doctor|health|symptoms|treatment)\b",
        r"\b(financial|investment|stock|crypto|bank|loan)\b",
        r"\b(political|religious|ideological)\b",
        r"\b(illegal|drugs|criminal|weapon)\b",
        r"\b(construction|home\s*repair|electrical\s*wiring)\b",
        r"\b(disassemble|remove\s*airbag|remove\s*seatbelt)\b",
        r"\b(bypass\s*(sensor|alarm|limit\s*switch))\b",
    ]
]

RATE_LIMIT: dict[str, list[float]] = {}
RATE_WINDOW = 60.0  # seconds
RATE_MAX = 10      # requests per window

@dataclass
class SafetyCheck:
    is_safe: bool
    risk_level: str
    concerns: list[str]
    action: str  # allow | warn | block

def check_rate_limit(session_id: str = "default") -> bool:
    now = time.time()
    if session_id not in RATE_LIMIT:
        RATE_LIMIT[session_id] = []
    RATE_LIMIT[session_id] = [t for t in RATE_LIMIT[session_id] if now - t < RATE_WINDOW]
    if len(RATE_LIMIT[session_id]) >= RATE_MAX:
        return False
    RATE_LIMIT[session_id].append(now)
    return True

def safety_check(query: str, response: str = "", session_id: str = "default") -> SafetyCheck:
    if not check_rate_limit(session_id):
        return SafetyCheck(False, "high", ["Rate limit exceeded (10 req/min). Vui lòng chờ một lát."], "block")

    concerns = []
    for pat in OFF_TOPIC_PATTERNS:
        if pat.search(query) or pat.search(response):
            concerns.append(f"Off-topic pattern detected: {pat.pattern[:30]}")

    if concerns:
        return SafetyCheck(False, "medium", concerns, "block")

    danger_pat = re.compile(r"\b(disable\s*ABS|disable\s*brake\s*assist|disable\s*stability)\b", re.I)
    if danger_pat.search(query) or danger_pat.search(response):
        return SafetyCheck(False, "high", ["Dangerous instruction detected."], "block")

    return SafetyCheck(True, "none", [], "allow")

# ── Orchestrator Agent ────────────────────────────────────────
OFF_TOPIC_MSG = """Xin lỗi, tôi chỉ có thể hỗ trợ về xe VinFast — như tính năng ADAS, sạc pin, đèn cảnh báo, vận hành, bảo dưỡng, và thông số kỹ thuật.

Nếu bạn có câu hỏi về xe VinFast, hãy hỏi tôi nhé! Ví dụ: "Cách sạc pin VF8?" hoặc "Đèn check engine là gì?"
"""

LOW_CONTEXT_MSG = """Tôi không tìm thấy thông tin chính xác trong Manual VinFast cho câu hỏi của bạn. Để được hỗ trợ tốt nhất:
1. Liên hệ hotline VinFast: 1900 232 389
2. Ghé showroom VinFast gần nhất
3. Tra cứu Manual điện tử tại om.vinfastauto.com

Thông tin chỉ mang tính tham khảo."""

async def run_orchestrator(
    query: str,
    car_model: str = "VF8",
    image_data: str | None = None,
    conversation_history: list[dict] | None = None,
    api_key: str = "",
    session_id: str = "default",
) -> SynthesisResult:
    history = conversation_history or []

    logger.info(f"[{session_id}] Safety check: query='{query[:50]}'")
    # 1. Safety check
    safety = safety_check(query, session_id=session_id)
    if not safety.is_safe:
        logger.warning(f"[{session_id}] Blocked — {safety.concerns}")
        return SynthesisResult(
            answer=safety.concerns[0] if safety.concerns else OFF_TOPIC_MSG,
            sources=[], confidence=0.0, car_model=car_model
        )

    logger.info(f"[{session_id}] Retrieving (car={car_model})")
    # 2. Retrieve
    chunks = retrieve(query, car_model=car_model, top_k=5, threshold=0.05)
    if not chunks:
        logger.warning(f"[{session_id}] No chunks retrieved")
        return SynthesisResult(
            answer=LOW_CONTEXT_MSG, sources=[], confidence=0.0, car_model=car_model
        )
    logger.info(f"[{session_id}] Retrieved {len(chunks)} chunks (top score={chunks[0][1]:.3f})")

    # 3. Synthesize
    try:
        logger.info(f"[{session_id}] Synthesizing via OpenAI...")
        result = await synthesize(
            query=query,
            context_chunks=chunks,
            car_model=car_model,
            conversation_history=history,
            api_key=api_key,
        )
        logger.info(f"[{session_id}] Done — conf={result.confidence:.2f}")
        return result
    except Exception as e:
        logger.error(f"[{session_id}] Synthesize error: {e}")
        return SynthesisResult(
            answer=f"Lỗi: {str(e)}",
            sources=[],
            confidence=0.0,
            car_model=car_model
        )
