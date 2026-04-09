"""Safety agent: off-topic detection + rate limiting."""
import re
import time
import logging
from dataclasses import dataclass

logger = logging.getLogger("vinfast")

_OFF_TOPIC = [
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
_DANGER = re.compile(r"\b(disable\s*ABS|disable\s*brake\s*assist|disable\s*stability)\b", re.I)

_RATE: dict[str, list[float]] = {}
_WINDOW = 60.0
_MAX = 10


@dataclass
class SafetyResult:
    is_safe: bool
    reason: str = ""


def check(query: str, session_id: str = "default") -> SafetyResult:
    # Rate limit
    now = time.time()
    _RATE.setdefault(session_id, [])
    _RATE[session_id] = [t for t in _RATE[session_id] if now - t < _WINDOW]
    if len(_RATE[session_id]) >= _MAX:
        return SafetyResult(False, "Rate limit exceeded (10 req/min). Vui lòng chờ một lát.")
    _RATE[session_id].append(now)

    # Dangerous instruction
    if _DANGER.search(query):
        return SafetyResult(False, "Yêu cầu này có thể gây nguy hiểm. Không thể hỗ trợ.")

    # Off-topic
    for pat in _OFF_TOPIC:
        if pat.search(query):
            return SafetyResult(False, "")   # empty → use OFF_TOPIC_MSG

    return SafetyResult(True)
