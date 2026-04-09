"""
VinFast Car Assistant — FastAPI entry point.
Routes only. Business logic lives in core/, tools/, rag/, llm/.
"""
import logging
import sys
import uvicorn
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional

# ── Logging ───────────────────────────────────────────────────
logger = logging.getLogger("vinfast")
logger.setLevel(logging.INFO)
_h = logging.StreamHandler(sys.stdout)
_h.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-7s | %(message)s", datefmt="%H:%M:%S"))
logger.addHandler(_h)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

from .config import LLM_MODEL, LLM_PROVIDER, PORT
from .core.orchestrator import run_orchestrator
from .rag.db import db_stats
from .tools.location import find_nearby_stations

app = FastAPI(title="VinFast Car Assistant API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Models ────────────────────────────────────────────────────
class AgentRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    car_model: str = Field(default="VF8", pattern="^(VF[0-9]|VF 9|VF 8|VF 7)$")
    image_data: Optional[str] = None
    conversation_history: list[dict] = Field(default_factory=list)
    user_profile: Optional[dict] = None  # {name, car_variant, current_km}

class IntentRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)

class AgentResponse(BaseModel):
    text: str
    agent: str = "orchestrator"
    sources: list[dict] = Field(default_factory=list)
    confidence: float
    is_safety_warning: bool = False
    category: Optional[str] = None
    tool_action: Optional[dict] = None   # signals frontend to run a tool

class NearbyStationsRequest(BaseModel):
    lat: float
    lng: float
    station_type: str = Field(default="charging", pattern="^(charging|service)$")
    radius_km: int = Field(default=15, ge=1, le=50)

class SearchPlacesRequest(BaseModel):
    lat: float
    lng: float
    keyword: str = Field(..., min_length=1, max_length=100)
    limit: int = Field(default=5, ge=1, le=20)

class DirectionsRequest(BaseModel):
    destination: str = Field(..., min_length=1, max_length=200)

class FeedbackRequest(BaseModel):
    message_id: str
    query: str
    ai_answer: str
    thumbs_up: bool = False
    thumbs_down: bool = False
    car_model: str = "VF8"

_feedback_logs: list[dict] = []

# ── Routes ────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    stats = db_stats()
    return {"status": "ok", "provider": LLM_PROVIDER, "model": LLM_MODEL, "db": stats}


@app.post("/api/intent")
async def classify_intent_endpoint(req: IntentRequest, authorization: Optional[str] = Header(None)):
    """Fast intent classification — frontend calls this before executing tools."""
    import os
    from .core.intent import classify_intent
    api_key = (authorization.replace("Bearer ", "") if authorization else os.getenv("OPENAI_API_KEY", "")).strip()
    if not api_key:
        raise HTTPException(401, "API key required.")
    logger.info(f"POST /api/intent | '{req.query[:60]}'")
    result = await classify_intent(req.query, api_key)
    return result


@app.post("/api/agent", response_model=AgentResponse)
async def agent(req: AgentRequest, authorization: Optional[str] = Header(None)):
    import os
    api_key = (authorization.replace("Bearer ", "") if authorization else os.getenv("OPENAI_API_KEY", "")).strip()
    if not api_key:
        raise HTTPException(401, "API key required. Set OPENAI_API_KEY or pass Bearer token.")

    logger.info(f"POST /api/agent | '{req.query[:60]}' model={req.car_model}")
    result = await run_orchestrator(
        query=req.query,
        car_model=req.car_model.replace(" ", ""),
        image_data=req.image_data,
        conversation_history=req.conversation_history,
        api_key=api_key,
        user_profile=req.user_profile,
    )
    return AgentResponse(
        text=result.answer,
        sources=result.sources,
        confidence=result.confidence,
        category=result.category,
        tool_action=result.tool_action,
    )


@app.post("/api/nearby-stations")
async def nearby_stations(req: NearbyStationsRequest):
    """Find charging stations or service centers near a GPS coordinate."""
    from .config import SERPAPI_KEY
    logger.info(f"POST /api/nearby-stations | type={req.station_type} lat={req.lat:.4f} lng={req.lng:.4f}")
    result = await find_nearby_stations(
        lat=req.lat, lng=req.lng,
        station_type=req.station_type,  # type: ignore
        radius_km=req.radius_km,
        serpapi_key=SERPAPI_KEY,
    )
    return result


@app.post("/api/search-places")
async def search_places_endpoint(req: SearchPlacesRequest):
    """Search nearby places by keyword (food, coffee, store, etc.)."""
    from .config import SERPAPI_KEY
    from .tools.places import search_places
    logger.info(f"POST /api/search-places | keyword='{req.keyword}' limit={req.limit} lat={req.lat:.4f} lng={req.lng:.4f}")
    result = await search_places(
        lat=req.lat, lng=req.lng,
        keyword=req.keyword, limit=req.limit,
        serpapi_key=SERPAPI_KEY,
    )
    return result


@app.post("/api/directions")
async def directions_endpoint(req: DirectionsRequest):
    """Geocode a destination via Nominatim and return a Google Maps directions URL."""
    from .tools.places import geocode_destination
    logger.info(f"POST /api/directions | destination='{req.destination}'")
    result = await geocode_destination(req.destination)
    return result


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    import datetime
    _feedback_logs.append({**req.model_dump(), "timestamp": datetime.datetime.now().isoformat()})
    return {"status": "ok", "total": len(_feedback_logs)}


@app.get("/api/feedback/export")
async def export_feedback():
    return JSONResponse({"logs": _feedback_logs[-100:]})


@app.get("/api/knowledge/stats")
async def knowledge_stats():
    return db_stats()


@app.post("/api/ingest")
async def trigger_ingest():
    import asyncio
    from .rag.ingest import run_ingest
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, run_ingest)
    return {"status": "ok", "db_stats": db_stats()}


# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=False)
