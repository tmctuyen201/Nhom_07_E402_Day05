"""OpenAI Chat Completions synthesizer."""
import json
import logging
import httpx

from ..core.types import SynthesisResult, RetrievedChunk
from ..core.prompts import build_system_prompt
from ..tools.registry import TOOL_DEFINITIONS, dispatch_tool
from ..config import LLM_MODEL

logger = logging.getLogger("vinfast")


def _build_context(chunks: list[tuple]) -> str:
    if not chunks:
        return "Không có thông tin trong Manual."
    return "\n\n".join(
        f"[{getattr(c, 'source', '')} | {getattr(c, 'section', '')}]\n{c.content}"
        for c, _ in chunks
    )


def _sources(chunks: list[tuple]) -> list[dict]:
    return [
        {
            "pageNumber": getattr(c, "page_number", 0),
            "chapter":    getattr(c, "chapter", getattr(c, "section", "")),
            "section":    getattr(c, "section", ""),
            "source":     getattr(c, "source", ""),
            "excerpt":    c.content[:120],
        }
        for c, _ in chunks
    ]


def _confidence(chunks: list[tuple]) -> float:
    return min(1.0, chunks[0][1] * 2) if chunks else 0.0


async def synthesize(
    query: str,
    context_chunks: list[tuple],
    car_model: str,
    conversation_history: list[dict],
    api_key: str,
    user_profile: dict | None = None,
) -> SynthesisResult:
    context_str = _build_context(context_chunks)
    system = build_system_prompt(context_str, car_model, user_profile)

    messages = [
        {"role": "system", "content": system},
        *[{"role": m["role"], "content": m["content"]} for m in conversation_history[-20:]],
        {"role": "user", "content": query},
    ]

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body = {
        "model": LLM_MODEL,
        "messages": messages,
        "tools": TOOL_DEFINITIONS,
        "tool_choice": "auto",
        "temperature": 0.3,
        "max_tokens": 800,
    }

    tool_action = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body)
        if not resp.is_success:
            logger.error(f"OpenAI {resp.status_code}: {resp.text[:200]}")
            resp.raise_for_status()
        data = resp.json()

    choice = data["choices"][0]
    msg = choice["message"]
    final_text = msg.get("content") or ""

    if msg.get("tool_calls"):
        tool_call = msg["tool_calls"][0]
        fn_name = tool_call["function"]["name"]
        fn_args = json.loads(tool_call["function"]["arguments"])
        logger.info(f"  → Tool call: {fn_name}({fn_args})")

        result = dispatch_tool(fn_name, fn_args)

        # Location tool → signal frontend, get LLM to write intro text
        if isinstance(result, dict) and result.get("__tool_action__"):
            tool_action = result
            tool_type = result.get("tool", "")
            if tool_type == "find_nearby_stations":
                label = "trạm sạc" if result.get("station_type") == "charging" else "trung tâm bảo dưỡng"
                fn_result_str = f"Đang tìm {label} VinFast gần bạn. Kết quả sẽ hiển thị ngay bên dưới."
            elif tool_type == "battery_range":
                fn_result_str = (
                    f"Pin {result['battery_level']:.0f}% → còn khoảng {result['range_km']} km "
                    f"({result['driving_mode']} mode). {result['advice']}"
                )
            elif tool_type == "maintenance_schedule":
                fn_result_str = (
                    f"{result['summary']} Xe {result['car_model']} tại {result['current_km']:,.0f} km. "
                    f"Quá hạn: {result['overdue_count']}, sắp đến: {result['due_soon_count']}."
                )
            else:
                fn_result_str = "Đã xử lý yêu cầu."
        else:
            fn_result_str = str(result)

        messages.append(msg)
        messages.append({
            "role": "tool",
            "content": fn_result_str,
            "tool_call_id": tool_call["id"],
        })

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp2 = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json={"model": LLM_MODEL, "messages": messages, "temperature": 0.3, "max_tokens": 400},
            )
            if resp2.is_success:
                final_text = resp2.json()["choices"][0]["message"].get("content") or final_text

    return SynthesisResult(
        answer=final_text,
        sources=_sources(context_chunks),
        confidence=_confidence(context_chunks),
        car_model=car_model,
        category=context_chunks[0][0].category if context_chunks else None,
        tool_action=tool_action,
    )
