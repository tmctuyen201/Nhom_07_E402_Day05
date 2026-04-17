"""
VinFast Car Assistant — FastAPI entry point.
Routes only. Business logic lives in core/, tools/, rag/, llm/.
"""

import logging
import sys
import uvicorn
import os
import signal
import time
import jwt
import hashlib
from datetime import datetime, timezone, timedelta
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Request, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional

# ── Logging ───────────────────────────────────────────────────
logger = logging.getLogger("vinfast")
logger.setLevel(logging.INFO)
_h = logging.StreamHandler(sys.stdout)
_h.setFormatter(
    logging.Formatter("%(asctime)s | %(levelname)-7s | %(message)s", datefmt="%H:%M:%S")
)
logger.addHandler(_h)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

from .config import LLM_MODEL, LLM_PROVIDER, PORT, ENVIRONMENT, REDIS_URL

# Auth setup
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret-change-in-production")
API_KEY_SECRET = os.getenv("API_KEY_SECRET", "dev-api-key-change-in-production")

# Rate limiting config
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "20"))

# Cost guard config
DAILY_BUDGET_USD = float(os.getenv("DAILY_BUDGET_USD", "5.0"))


def check_rate_limit(key: str):
    """Sliding window rate limiter."""
    now = time.time()
    window = _rate_windows[key]
    while window and window[0] < now - 60:
        window.popleft()
    if len(window) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {RATE_LIMIT_PER_MINUTE} req/min",
            headers={"Retry-After": "60"},
        )
    window.append(now)


def check_and_record_cost(input_tokens: int, output_tokens: int):
    """Cost guard with daily budget tracking."""
    global _daily_cost, _cost_reset_day
    today = time.strftime("%Y-%m-%d")
    if today != _cost_reset_day:
        _daily_cost = 0.0
        _cost_reset_day = today
    if _daily_cost >= DAILY_BUDGET_USD:
        raise HTTPException(503, "Daily budget exhausted. Try tomorrow.")
    cost = (input_tokens / 1000) * 0.00015 + (output_tokens / 1000) * 0.0006
    _daily_cost += cost


def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """Verify API key authentication."""
    if not api_key or api_key != API_KEY_SECRET:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key. Include header: X-API-Key: <key>",
        )
    return api_key


# Track startup time and readiness
START_TIME = time.time()
_is_ready = False

# Redis client (initialized in lifespan)
redis_client = None

# Rate limiter (sliding window)
_rate_windows: dict[str, deque] = defaultdict(deque)

# Cost guard
_daily_cost = 0.0
_cost_reset_day = time.strftime("%Y-%m-%d")
from .core.orchestrator import run_orchestrator
from .rag.db import db_stats
from .tools.location import find_nearby_stations


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _is_ready, redis_client

    # --- Startup ---
    logger.info(
        "🚀 Starting up: Pre-loading PGVector connection, embedding model, and Redis..."
    )
    try:
        from .rag.embeddings import _get_vector_store, _get_embedding_model

        # Pre-load embedding model
        _get_embedding_model()
        logger.info("✅ Embedding model pre-loaded")

        # Pre-load PGVector connection
        _get_vector_store()
        logger.info("✅ PGVector connection pre-loaded")

        # Initialize Redis
        try:
            import redis

            redis_client = redis.from_url(REDIS_URL)
            redis_client.ping()
            logger.info("✅ Redis connection established")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            redis_client = None

        _is_ready = True
        logger.info("🎉 Startup complete! Ready to serve requests.")
    except Exception as e:
        logger.error(f"⚠️ Startup warning: {e}")
        logger.info("Server will continue but first request may be slower.")

    yield  # App running

    # --- Shutdown ---
    _is_ready = False
    if redis_client:
        redis_client.close()
    logger.info("Shutting down gracefully...")


app = FastAPI(title="VinFast Car Assistant API", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


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
    tool_action: Optional[dict] = None  # signals frontend to run a tool


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


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    voice: str = Field(default="nova")  # nova | shimmer | alloy | echo | fable | onyx


class FeedbackRequest(BaseModel):
    message_id: str
    query: str
    ai_answer: str
    thumbs_up: bool = False
    thumbs_down: bool = False
    car_model: str = "VF8"


# JWT Auth models
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ── Routes ────────────────────────────────────────────────────


def get_feedback_logs() -> list[dict]:
    """Get feedback logs from Redis."""
    if not redis_client:
        return []
    try:
        logs = redis_client.lrange("feedback_logs", 0, -1)
        return [json.loads(log.decode()) for log in logs]
    except:
        return []


def add_feedback_log(log: dict):
    """Add feedback log to Redis."""
    if redis_client:
        try:
            redis_client.lpush("feedback_logs", json.dumps(log))
            redis_client.ltrim("feedback_logs", 0, 99)  # Keep only last 100
        except:
            pass


@app.get("/api/health")
async def health():
    """Liveness probe: Check if service is running and can respond."""
    stats = db_stats()
    uptime = round(time.time() - START_TIME, 1)

    checks = {"llm": LLM_PROVIDER, "db": "ok"}
    if redis_client:
        try:
            redis_client.ping()
            checks["redis"] = "ok"
        except:
            checks["redis"] = "error"
    else:
        checks["redis"] = "not_configured"

    return {
        "status": "ok",
        "uptime_seconds": uptime,
        "provider": LLM_PROVIDER,
        "model": LLM_MODEL,
        "db": stats,
        "checks": checks,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/ready")
async def ready():
    """Readiness probe: Check if service is ready to handle requests."""
    if not _is_ready:
        raise HTTPException(status_code=503, detail="Service not ready yet")
    return {"ready": True}


@app.post("/auth/token", response_model=TokenResponse)
async def login_for_access_token(req: LoginRequest):
    """JWT authentication endpoint."""
    # Simple auth - in production, use proper user management
    if (
        req.username == "admin"
        and hashlib.sha256(req.password.encode()).hexdigest()[:8] == "admin123"
    ):
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
        to_encode = {"sub": req.username, "exp": expire.timestamp()}
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
        return TokenResponse(access_token=encoded_jwt, expires_in=86400)
    raise HTTPException(401, "Invalid credentials")


@app.post("/api/intent")
async def classify_intent_endpoint(
    req: IntentRequest, authorization: Optional[str] = Header(None)
):
    """Fast intent classification — frontend calls this before executing tools."""
    import os
    from .core.intent import classify_intent

    api_key = (
        authorization.replace("Bearer ", "")
        if authorization
        else os.getenv("OPENAI_API_KEY", "")
    ).strip()
    if not api_key:
        raise HTTPException(401, "API key required.")
    logger.info(f"POST /api/intent | '{req.query[:60]}'")
    result = await classify_intent(req.query, api_key)
    return result


@app.post("/api/agent", response_model=AgentResponse)
async def agent(
    req: AgentRequest,
    authorization: Optional[str] = Header(None),
    api_key_verified: str = Depends(verify_api_key),
):
    import os

    api_key = (
        authorization.replace("Bearer ", "")
        if authorization
        else os.getenv("OPENAI_API_KEY", "")
    ).strip()
    if not api_key:
        raise HTTPException(
            401, "API key required. Set OPENAI_API_KEY or pass Bearer token."
        )

    # Rate limiting per API key
    check_rate_limit(api_key_verified[:8])

    # Cost guard
    input_tokens = len(req.query.split()) * 2
    check_and_record_cost(input_tokens, 0)

    logger.info(f"POST /api/agent | '{req.query[:60]}' model={req.car_model}")
    result = await run_orchestrator(
        query=req.query,
        car_model=req.car_model.replace(" ", ""),
        image_data=req.image_data,
        conversation_history=req.conversation_history,
        api_key=api_key,
        user_profile=req.user_profile,
    )

    output_tokens = len(result.answer.split()) * 2
    check_and_record_cost(0, output_tokens)

    return AgentResponse(
        text=result.answer,
        sources=result.sources,
        confidence=result.confidence,
        category=result.category,
        tool_action=result.tool_action,
    )

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

    logger.info(
        f"POST /api/nearby-stations | type={req.station_type} lat={req.lat:.4f} lng={req.lng:.4f}"
    )
    result = await find_nearby_stations(
        lat=req.lat,
        lng=req.lng,
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

    logger.info(
        f"POST /api/search-places | keyword='{req.keyword}' limit={req.limit} lat={req.lat:.4f} lng={req.lng:.4f}"
    )
    result = await search_places(
        lat=req.lat,
        lng=req.lng,
        keyword=req.keyword,
        limit=req.limit,
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


@app.post("/api/tts")
async def tts_endpoint(req: TTSRequest, authorization: Optional[str] = Header(None)):
    """Convert text to speech using OpenAI TTS API. Returns audio/mpeg."""
    import os
    import httpx
    from fastapi.responses import Response

    api_key = (
        authorization.replace("Bearer ", "")
        if authorization
        else os.getenv("OPENAI_API_KEY", "")
    ).strip()
    if not api_key:
        raise HTTPException(401, "API key required.")

    clean = _clean_for_tts(req.text)
    if not clean:
        raise HTTPException(400, "No speakable text after cleaning.")

    logger.info(f"POST /api/tts | voice={req.voice} len={len(clean)}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "tts-1-hd",
                "input": clean,
                "voice": req.voice,
                "response_format": "mp3",
            },
        )
        if not resp.is_success:
            logger.error(f"TTS error {resp.status_code}: {resp.text[:200]}")
            raise HTTPException(resp.status_code, "TTS failed")

    return Response(content=resp.content, media_type="audio/mpeg")


def _clean_for_tts(text: str) -> str:
    """Clean text for natural Vietnamese TTS output."""
    import re

    # Remove markdown formatting
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)  # **bold**
    t = re.sub(r"\*([^*]+)\*", r"\1", t)  # *italic*
    t = re.sub(r"`[^`]+`", "", t)  # `code`
    t = re.sub(r"#{1,6}\s+", "", t)  # headings
    t = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", t)  # [link](url)
    t = re.sub(r"https?://\S+", "", t)  # bare URLs

    # Remove emoji (Unicode ranges)
    t = re.sub(
        r"[\U0001F300-\U0001FFFF"
        r"\U00002600-\U000027BF"
        r"\U0000FE00-\U0000FE0F"
        r"\u2600-\u27BF]+",
        "",
        t,
        flags=re.UNICODE,
    )

    # Expand common abbreviations for better pronunciation
    replacements = {
        r"\bkm\b": "ki-lô-mét",
        r"\bkW\b": "ki-lô-oát",
        r"\bkWh\b": "ki-lô-oát giờ",
        r"\bPSI\b": "P S I",
        r"\bkPa\b": "ki-lô Pa-xcan",
        r"\bABS\b": "A B S",
        r"\bACC\b": "A C C",
        r"\bAEB\b": "A E B",
        r"\bLKA\b": "L K A",
        r"\bBSM\b": "B S M",
        r"\bADAS\b": "A-đát",
        r"\bRAG\b": "R A G",
        r"\bGPS\b": "G P S",
        r"\bAPI\b": "A P I",
        r"\bVF8\b": "VF tám",
        r"\bVF9\b": "VF chín",
        r"\bVF7\b": "VF bảy",
        r"1900\s*232\s*389": "một chín không không, hai ba hai, ba tám chín",
    }
    for pattern, replacement in replacements.items():
        t = re.sub(pattern, replacement, t, flags=re.IGNORECASE)

    # Remove bullet/list markers
    t = re.sub(r"^[-•*]\s+", "", t, flags=re.MULTILINE)
    t = re.sub(r"^\d+\.\s+", "", t, flags=re.MULTILINE)

    # Collapse whitespace and newlines into natural pauses
    t = re.sub(r"\n{2,}", ". ", t)
    t = re.sub(r"\n", ", ", t)
    t = re.sub(r"\s{2,}", " ", t)

    # Remove leftover special chars
    t = re.sub(r"[_~|<>{}\\]", "", t)

    return t.strip()[:900]  # OpenAI TTS max ~4096 chars, keep reasonable


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    import datetime

    log_entry = {**req.model_dump(), "timestamp": datetime.datetime.now().isoformat()}
    add_feedback_log(log_entry)
    logs = get_feedback_logs()
    return {"status": "ok", "total": len(logs)}


@app.get("/api/feedback/export")
async def export_feedback():
    logs = get_feedback_logs()
    return JSONResponse({"logs": logs})


@app.get("/api/knowledge/stats")
async def knowledge_stats():
    return db_stats()


@app.get("/api/metrics")
async def metrics(api_key_verified: str = Depends(verify_api_key)):
    """Protected metrics endpoint."""
    return {
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "daily_cost_usd": round(_daily_cost, 4),
        "daily_budget_usd": DAILY_BUDGET_USD,
        "budget_used_pct": round(_daily_cost / DAILY_BUDGET_USD * 100, 1)
        if DAILY_BUDGET_USD > 0
        else 0,
        "environment": ENVIRONMENT,
    }


@app.post("/api/ingest")
async def trigger_ingest():
    import asyncio
    from .rag.ingest import run_ingest

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, run_ingest)
    return {"status": "ok", "db_stats": db_stats()}


# ── Graceful Shutdown ───────────────────────────────────────────
def handle_sigterm(signum, frame):
    """Handle SIGTERM signal for graceful shutdown."""
    logger.info(f"Received signal {signum} — initiating graceful shutdown")


signal.signal(signal.SIGTERM, handle_sigterm)

# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info(f"Starting VinFast Assistant on 0.0.0.0:{PORT}")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=False)
