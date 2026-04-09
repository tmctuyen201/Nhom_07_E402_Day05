"""Anthropic Claude synthesizer."""
import logging
import httpx

from ..core.types import SynthesisResult, RetrievedChunk
from ..core.prompts import SYSTEM_PROMPT
from ..tools.registry import dispatch_tool
from ..config import LLM_MODEL, ANTHROPIC_KEY

logger = logging.getLogger("vinfast")

# Convert OpenAI tool format → Anthropic format
def _anthropic_tools(openai_tools: list[dict]) -> list[dict]:
    out = []
    for t in openai_tools:
        fn = t["function"]
        out.append({
            "name": fn["name"],
            "description": fn["description"],
            "input_schema": fn["parameters"],
        })
    return out


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


async def synthesize(
    query: str,
    context_chunks: list[tuple],
    car_model: str,
    conversation_history: list[dict],
    api_key: str,
) -> SynthesisResult:
    from ..tools.registry import TOOL_DEFINITIONS
    key = ANTHROPIC_KEY or api_key
    if not key:
        raise ValueError("ANTHROPIC_API_KEY required")

    context_str = _build_context(context_chunks)
    system = SYSTEM_PROMPT.format(context=context_str)

    messages = [
        *[{"role": m["role"], "content": m["content"]} for m in conversation_history[-20:]],
        {"role": "user", "content": query},
    ]

    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    body = {
        "model": LLM_MODEL,
        "max_tokens": 800,
        "system": system,
        "messages": messages,
        "tools": _anthropic_tools(TOOL_DEFINITIONS),
    }

    tool_action = None
    final_text = ""

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=body)
        if not resp.is_success:
            logger.error(f"Anthropic {resp.status_code}: {resp.text[:200]}")
            resp.raise_for_status()
        data = resp.json()

    for block in data.get("content", []):
        if block.get("type") == "text":
            final_text = block["text"]
        elif block.get("type") == "tool_use":
            fn_name = block["name"]
            fn_args = block["input"]
            logger.info(f"  → Tool call: {fn_name}({fn_args})")

            result = dispatch_tool(fn_name, fn_args)

            if isinstance(result, dict) and result.get("__tool_action__"):
                tool_action = result
                fn_result_str = (
                    f"Đang tìm {'trạm sạc' if result['station_type'] == 'charging' else 'trung tâm bảo dưỡng'} "
                    f"VinFast gần bạn. Kết quả sẽ hiển thị ngay bên dưới."
                )
            else:
                fn_result_str = str(result)

            messages.append({"role": "assistant", "content": data["content"]})
            messages.append({"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": block["id"], "content": fn_result_str}
            ]})

            async with httpx.AsyncClient(timeout=60.0) as client:
                resp2 = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json={"model": LLM_MODEL, "max_tokens": 400, "system": system, "messages": messages},
                )
                if resp2.is_success:
                    for b in resp2.json().get("content", []):
                        if b.get("type") == "text":
                            final_text = b["text"]

    return SynthesisResult(
        answer=final_text,
        sources=_sources(context_chunks),
        confidence=min(1.0, context_chunks[0][1] * 2) if context_chunks else 0.0,
        car_model=car_model,
        category=context_chunks[0][0].category if context_chunks else None,
        tool_action=tool_action,
    )
