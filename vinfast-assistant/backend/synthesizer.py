"""
RAG Synthesizer — calls LLM via OpenAI Chat Completions (sk-*)
or Anthropic Claude (claude-*) depending on LLM_PROVIDER.
"""
import logging
import os
import httpx
from .synthesizer_types import SynthesisResult, RetrievedChunk
from .config import LLM_MODEL, LLM_PROVIDER

logger = logging.getLogger("vinfast")

SYSTEM_PROMPT = """Bạn là trợ lý kỹ thuật xe VinFast chuyên nghiệp, lịch sự và chính xác.

QUY TẮC NGHIÊM NGẶT:
1. Chỉ trả lời về xe VinFast — nếu câu hỏi ngoài lề, hãy lịch sự từ chối
2. Luôn trích dẫn số trang từ Manual: ví dụ "Theo Manual VF8 trang 112..."
3. Nếu không chắc chắn, nói rõ và gợi ý liên hệ showroom VinFast
4. Cảnh báo an toàn: nếu câu hỏi liên quan đến an toàn (phanh, đèn cảnh báo), nhấn mạnh mức độ ưu tiên
5. Luôn nhắc nhở: "Thông tin chỉ mang tính tham khảo. Liên hệ hotline VinFast 1900 232 389 để được hỗ trợ chính xác nhất."

NGỮ CẢNH TỪ MANUAL (dùng để trả lời):
{context}

TRẢ LỜI BẰNG TIẾNG VIỆT."""

FUNCTION_TOOLS = [
    {
        "type": "function",
        "name": "get_warning_light_info",
        "description": "Tra cứu thông tin về đèn cảnh báo trên taplo xe VinFast",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Tên đèn cảnh báo (ví dụ: check engine, brake, tire pressure, battery)"}
            },
            "required": ["name"]
        }
    },
    {
        "type": "function",
        "name": "get_adas_feature_info",
        "description": "Tra cứu thông tin về tính năng ADAS của xe VinFast",
        "parameters": {
            "type": "object",
            "properties": {
                "feature": {"type": "string", "description": "Tên tính năng ADAS (ví dụ: LKA, ACC, AEB, BSM, LDW)"}
            },
            "required": ["feature"]
        }
    },
    {
        "type": "function",
        "name": "get_charging_guide",
        "description": "Hướng dẫn sạc pin xe VinFast dựa trên mức pin hiện tại",
        "parameters": {
            "type": "object",
            "properties": {
                "battery_level": {"type": "number", "description": "Mức pin hiện tại (%) từ 0-100"}
            },
            "required": ["battery_level"]
        }
    }
]

def resolve_function(name: str, args: dict) -> str:
    """Resolve function call to a knowledge-base result."""
    if name == "get_warning_light_info":
        n = str(args.get("name", "")).lower()
        if "check engine" in n or "động cơ" in n:
            return "Check Engine Warning: Đèn báo lỗi động cơ. Khuyến nghị: Đưa xe đến trung tâm dịch vụ VinFast sớm nhất."
        if "brake" in n or "phanh" in n:
            return "Brake Warning: Đèn phanh đỏ báo parking brake đang kích hoạt hoặc mức dầu phanh thấp. Hành động: Thả phanh tay; nếu đèn vẫn sáng sau khi thả, DỪNG LẠI NGAY và gọi cứu hộ VinFast."
        if "tire" in n or "áp suất" in n or "lốp" in n:
            return "TPMS Warning: Áp suất lốp thấp. Hành động: Bơm lốp tại trạm xăng gần nhất (áp suất theo tem cửa: 38 PSI / 260 kPa trước, 36 PSI / 250 kPa sau)."
        if "battery" in n or "pin" in n or "sạc" in n:
            return "Battery Warning: Lỗi hệ thống quản lý pin cao áp. Hành động: DỪNG LẠI NGAY, không tắt máy nếu đang sạc. Gọi cứu hộ VinFast 1900 232 389."
        return f"Không tìm thấy thông tin chi tiết cho '{args.get('name')}'. Liên hệ hotline VinFast."
    if name == "get_adas_feature_info":
        f = str(args.get("feature", "")).lower()
        if "lka" in f or "lane keep" in f:
            return "Lane Keeping Assist (LKA): Hỗ trợ giữ làn đường. Camera phía trước nhận diện vạch kẻ. Khi xe đi lệch làn mà không bật xi-nhan, LKA tự điều chỉnh nhẹ vô lăng. Tốc độ hoạt động: trên 60 km/h."
        if "acc" in f or "cruise" in f:
            return "Adaptive Cruise Control (ACC): Ga tự động thích ứng. Duy trì khoảng cách an toàn với xe phía trước. Có thể phanh đến dừng hoàn toàn trong kẹt xe và tự động bò theo xe."
        if "aeb" in f or "emergency" in f:
            return "Automatic Emergency Braking (AEB): Phanh khẩn cấp tự động. Phát hiện nguy cơ va chạm phía trước (xe, người đi bộ, xe đạp) và phanh tự động nếu tài xế không phản ứng. Hoạt động từ 5–150 km/h."
        if "bsm" in f or "blind" in f:
            return "Blind Spot Monitoring (BSM): Giám sát điểm mù. Radar phía sau phát hiện xe trong điểm mù. Đèn báo sáng trên gương; nếu bật xi-nhan mà có xe, đèn nháy cảnh báo."
        return f"Không tìm thấy thông tin chi tiết cho tính năng '{args.get('feature')}'."
    if name == "get_charging_guide":
        level = float(args.get("battery_level", 0))
        if level < 10:
            return f"Pin chỉ còn {level}% — mức rất thấp. KHẨN CẤP: Tìm trạm sạc gần nhất qua app VinFast ngay!"
        if level < 20:
            return f"Pin còn {level}% — mức thấp. Nên sạc sớm. Khuyến nghị sạc AC (sạc chậm) qua đêm."
        if level < 50:
            return f"Pin còn {level}% — mức trung bình. Phù hợp sạc AC qua đêm. Sạc đến 80% cho sử dụng hàng ngày."
        return f"Pin còn {level}% — mức tốt. Tiếp tục sử dụng bình thường."
    return f"Không tìm thấy chức năng '{name}'."

def build_context(contexts: list[RetrievedChunk]) -> str:
    if not contexts:
        return "Không có thông tin trong Manual."
    return "\n\n".join(
        f"[Trang {c.chunk.page_number} | {c.chunk.chapter} > {c.chunk.section}]\n{c.chunk.content}"
        for c in contexts
    )

def _make_sources(context_chunks: list[tuple]) -> list[dict]:
    return [
        {"pageNumber": c.page_number, "chapter": c.chapter, "section": c.section, "excerpt": c.content[:120]}
        for c, _ in context_chunks
    ]

def _confidence(context_chunks: list[tuple]) -> float:
    return min(1.0, (context_chunks[0][1] * 2) if context_chunks else 0.0)


async def synthesize(
    query: str,
    context_chunks: list[tuple],
    car_model: str,
    conversation_history: list[dict],
    api_key: str,
) -> SynthesisResult:
    """Route to OpenAI or Anthropic based on LLM_PROVIDER in config."""
    if LLM_PROVIDER == "anthropic":
        logger.info("  → Route: Anthropic Claude")
        return await _synthesize_anthropic(query, context_chunks, car_model, conversation_history, api_key)
    else:
        logger.info(f"  → Route: OpenAI ({LLM_MODEL})")
        return await _synthesize_openai(query, context_chunks, car_model, conversation_history, api_key)


# ─── Anthropic Claude ──────────────────────────────────────────────────────────────

async def _synthesize_anthropic(
    query: str,
    context_chunks: list[tuple],
    car_model: str,
    conversation_history: list[dict],
    api_key: str,
) -> SynthesisResult:
    """Call Anthropic Claude via Messages API."""
    from .config import ANTHROPIC_KEY
    import json as _json

    key = ANTHROPIC_KEY or api_key
    if not key:
        raise ValueError("ANTHROPIC_API_KEY required in .env (or send Bearer token from frontend)")

    context_str = build_context([
        RetrievedChunk(chunk=chunk, score=score)
        for chunk, score in context_chunks
    ])

    system = SYSTEM_PROMPT.replace("{context}", context_str)

    history_msgs = [
        {"role": m["role"], "content": m["content"]}
        for m in conversation_history[-20:]
    ]

    messages = [
        *history_msgs,
        {"role": "user", "content": query}
    ]

    logger.info(f"  → messages: {len(messages)} history + 1 user")

    body = {
        "model": LLM_MODEL,
        "max_tokens": 800,
        "system": system,
        "messages": messages,
    }

    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers, json=body
        )
        if not resp.is_success:
            logger.error(f"  → Anthropic error {resp.status_code}: {resp.text}")
            resp.raise_for_status()
        data = resp.json()

    content_blocks = data.get("content", [])
    final_text = ""
    for block in content_blocks:
        if block.get("type") == "text":
            final_text = block["text"]
        elif block.get("type") == "tool_use":
            fn_name = block["name"]
            fn_input = block["input"]
            fn_result = resolve_function(fn_name, fn_input)
            logger.info(f"  → Tool call: {fn_name}({fn_input})")

            # Second request with tool result
            messages.append({"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": block["id"], "content": fn_result}
            ]})
            resp2 = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={"model": LLM_MODEL, "max_tokens": 800, "system": system, "messages": messages}
            )
            if not resp2.is_success:
                logger.error(f"  → Anthropic tool call error {resp2.status_code}: {resp2.text}")
                resp2.raise_for_status()
            for b in resp2.json().get("content", []):
                if b.get("type") == "text":
                    final_text = b["text"]

    logger.info(f"  → Answer: {len(final_text)} chars")
    return SynthesisResult(
        answer=final_text,
        sources=_make_sources(context_chunks),
        confidence=_confidence(context_chunks),
        car_model=car_model,
        category=context_chunks[0][0].category if context_chunks else None,
    )


# ─── OpenAI Chat Completions ─────────────────────────────────────────────────────

async def _synthesize_openai(
    query: str,
    context_chunks: list[tuple],
    car_model: str,
    conversation_history: list[dict],
    api_key: str,
) -> SynthesisResult:
    """Call OpenAI Chat Completions API."""
    import json as _json

    context_str = build_context([
        RetrievedChunk(chunk=chunk, score=score)
        for chunk, score in context_chunks
    ])
    system = SYSTEM_PROMPT.replace("{context}", context_str)

    history_msgs = [
        {"role": m["role"], "content": m["content"]}
        for m in conversation_history[-20:]
    ]

    messages = [
        {"role": "system", "content": system},
        *history_msgs,
        {"role": "user", "content": query}
    ]

    logger.info(f"  → messages: {len(messages)} (sys=1, hist={len(history_msgs)}, user=1)")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    body = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 800,
    }

    logger.info(f"  → Calling OpenAI (model={LLM_MODEL})")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers, json=body
        )
        if not resp.is_success:
            logger.error(f"  → OpenAI error {resp.status_code}: {resp.text}")
            resp.raise_for_status()
        data = resp.json()

    choice = data["choices"][0]
    msg = choice["message"]
    logger.info(f"  → finish_reason={choice.get('finish_reason')}, has_content={bool(msg.get('content'))}")

    final_text = msg.get("content") or ""
    if msg.get("tool_calls"):
        tool_call = msg["tool_calls"][0]
        fn_name = tool_call["function"]["name"]
        fn_args = _json.loads(tool_call["function"]["arguments"])
        fn_result = resolve_function(fn_name, fn_args)
        logger.info(f"  → Tool call: {fn_name}({fn_args})")

        messages.append(msg)
        messages.append({
            "role": "tool",
            "content": f"[Function {fn_name} result]\n{fn_result}",
            "tool_call_id": tool_call["id"]
        })

        resp2 = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json={"model": LLM_MODEL, "messages": messages, "temperature": 0.3, "max_tokens": 800}
        )
        if not resp2.is_success:
            logger.error(f"  → Tool call error {resp2.status_code}: {resp2.text}")
            resp2.raise_for_status()
        final_text = resp2.json()["choices"][0]["message"].get("content") or final_text

    return SynthesisResult(
        answer=final_text,
        sources=_make_sources(context_chunks),
        confidence=_confidence(context_chunks),
        car_model=car_model,
        category=context_chunks[0][0].category if context_chunks else None,
    )
