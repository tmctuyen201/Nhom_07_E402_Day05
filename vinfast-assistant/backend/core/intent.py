"""
Intent classifier — fast LLM call to detect what the user wants.
Returns structured intent so the frontend can execute the right tool
without any regex rule-base.
"""
import json
import logging
import httpx
from ..config import LLM_MODEL

logger = logging.getLogger("vinfast")

# Intent schema returned to frontend
# intent: one of the values below
# params: tool-specific parameters extracted from the query

INTENT_PROMPT = """Classify the user query into exactly one intent. Reply with ONLY valid JSON, no explanation.

Intents:
- "greeting"                → greetings, small talk, thanks, "bạn làm được gì", "giúp tôi với", casual chat
- "find_charging_stations"  → user wants VinFast charging stations nearby
- "find_service_centers"    → user wants VinFast service/maintenance centers nearby
- "search_places"           → user wants to find any place nearby (food, cafe, ATM, hotel, etc.)
- "get_directions"          → user wants directions/navigation to a specific place
- "car_assistant"           → anything about VinFast car: features, warnings, charging, ADAS, maintenance, specs, battery range, odometer

JSON schema:
{
  "intent": "<intent>",
  "params": {
    // for search_places: {"keyword": "<what to search>", "limit": <number, default 5>}
    // for get_directions: {"destination": "<place name, cleaned, no trigger words>"}
    // for greeting / find_charging_stations / find_service_centers / car_assistant: {}
  }
}

Examples:
"xin chào" → {"intent":"greeting","params":{}}
"hello" → {"intent":"greeting","params":{}}
"hi bạn" → {"intent":"greeting","params":{}}
"cảm ơn bạn" → {"intent":"greeting","params":{}}
"bạn có thể giúp gì cho tôi" → {"intent":"greeting","params":{}}
"bạn làm được gì" → {"intent":"greeting","params":{}}
"ok cảm ơn" → {"intent":"greeting","params":{}}
"tìm quán phở gần đây" → {"intent":"search_places","params":{"keyword":"quán phở","limit":5}}
"tìm 6 quán cà phê" → {"intent":"search_places","params":{"keyword":"quán cà phê","limit":6}}
"chỉ đường cho tôi đến hồ hoàn kiếm" → {"intent":"get_directions","params":{"destination":"hồ hoàn kiếm"}}
"đường đến sân bay tân sơn nhất" → {"intent":"get_directions","params":{"destination":"sân bay tân sơn nhất"}}
"trạm sạc gần tôi" → {"intent":"find_charging_stations","params":{}}
"trạm bảo dưỡng vinfast" → {"intent":"find_service_centers","params":{}}
"pin VF8 còn 30% đi được bao xa" → {"intent":"car_assistant","params":{}}
"đèn check engine là gì" → {"intent":"car_assistant","params":{}}
"ATM gần đây" → {"intent":"search_places","params":{"keyword":"ATM","limit":5}}
"navigate to Vincom Center Hanoi" → {"intent":"get_directions","params":{"destination":"Vincom Center Hanoi"}}

User query: "{query}"
"""


async def classify_intent(query: str, api_key: str) -> dict:
    """
    Call LLM to classify intent. Fast — uses gpt-4o-mini with max_tokens=80.
    Falls back to {"intent": "car_assistant", "params": {}} on any error.
    """
    prompt = INTENT_PROMPT.replace("{query}", query.replace('"', "'"))

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 80,
                    "temperature": 0,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"]
            result = json.loads(text)
            logger.info(f"Intent: {result.get('intent')} params={result.get('params')}")
            return result
    except Exception as e:
        logger.warning(f"Intent classify failed ({e}), defaulting to car_assistant")
        return {"intent": "car_assistant", "params": {}}
