"""
FastAPI Server — VinFast Car Assistant Backend
"""
import logging
import sys
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn

# ── Structured logging setup ──────────────────────────────────
logger = logging.getLogger("vinfast")
logger.setLevel(logging.INFO)
_handler = logging.StreamHandler(sys.stdout)
_handler.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S"
))
logger.addHandler(_handler)

# Suppress noisy uvicorn access log (we keep startup + error only)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

from .config import LLM_MODEL, LLM_PROVIDER, PORT
from .agents import run_orchestrator
from .knowledge_base import KNOWLEDGE_BASE

app = FastAPI(title="VinFast Car Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response models ─────────────────────────────────
class AgentRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    car_model: str = Field(default="VF8", pattern="^(VF[0-9]|VF 9|VF 8)$")
    image_data: Optional[str] = None
    conversation_history: list[dict] = Field(default_factory=list)

class AgentResponse(BaseModel):
    text: str
    agent: str = "orchestrator"
    sources: list[dict] = Field(default_factory=list)
    confidence: float
    is_safety_warning: bool = False
    category: Optional[str] = None

class FeedbackRequest(BaseModel):
    message_id: str
    query: str
    ai_answer: str
    correction: Optional[str] = None
    thumbs_up: bool = False
    thumbs_down: bool = False
    car_model: str = "VF8"
    category: Optional[str] = None

# ── In-memory feedback storage (replace with DB in production) ──
_feedback_logs: list[dict] = []

# ── Routes ────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    logger.info("GET /api/health")
    return {
        "status": "ok",
        "service": "VinFast Car Assistant",
        "provider": LLM_PROVIDER,
        "model": LLM_MODEL,
        "knowledge_chunks": len(KNOWLEDGE_BASE),
    }

@app.post("/api/agent", response_model=AgentResponse)
async def agent(
    req: AgentRequest,
    authorization: Optional[str] = Header(None)
):
    import os
    api_key = (
        authorization.replace("Bearer ", "") if authorization
        else os.getenv("OPENAI_API_KEY", "")
    ).strip()

    logger.info(f"POST /api/agent | query='{req.query[:60]}' car_model={req.car_model}")

    if not api_key:
        logger.warning("401 — missing API key")
        raise HTTPException(status_code=401, detail="OpenAI API key required. Set OPENAI_API_KEY env var or pass Bearer token.")

    try:
        result = await run_orchestrator(
            query=req.query,
            car_model=req.car_model.replace(" ", ""),  # "VF 8" -> "VF8"
            image_data=req.image_data,
            conversation_history=req.conversation_history,
            api_key=api_key,
        )
        logger.info(f"  → answer (conf={result.confidence:.2f}, cat={result.category})")
        return AgentResponse(
            text=result.answer,
            agent="orchestrator",
            sources=result.sources,
            confidence=result.confidence,
            category=result.category
        )
    except Exception as e:
        logger.error(f"500 — {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    logger.info(f"POST /api/feedback | msg_id={req.message_id} thumbs={'up' if req.thumbs_up else 'down' if req.thumbs_down else 'none'}")
    _feedback_logs.append({
        "message_id": req.message_id,
        "query": req.query,
        "ai_answer": req.ai_answer,
        "thumbs_up": req.thumbs_up,
        "thumbs_down": req.thumbs_down,
        "car_model": req.car_model,
        "timestamp": __import__("datetime").datetime.now().isoformat()
    })
    return {"status": "ok", "total_logs": len(_feedback_logs)}

@app.get("/api/feedback/export")
async def export_feedback():
    logger.info(f"GET /api/feedback/export | {len(_feedback_logs)} logs")
    return JSONResponse(content={"logs": _feedback_logs[-100:]})

@app.get("/api/knowledge/stats")
async def knowledge_stats():
    logger.info("GET /api/knowledge/stats")
    from collections import Counter
    cats = Counter(c.category for c in KNOWLEDGE_BASE)
    models = Counter(c.car_model for c in KNOWLEDGE_BASE)
    return {
        "total_chunks": len(KNOWLEDGE_BASE),
        "by_category": dict(cats),
        "by_model": dict(models),
    }

# ── CLI crawler endpoint ──────────────────────────────────────
from .crawler import crawl_url

@app.post("/api/crawl")
async def crawl_manual(url: str, car_model: str = "VF8"):
    logger.info(f"POST /api/crawl | url={url} car={car_model}")
    from .crawler import crawl_vinfast_manual, CrawlResult
    result: CrawlResult = await crawl_vinfast_manual(url, car_model)
    logger.info(f"  → {len(result.chunks)} chunks, {result.total_pages} pages, {len(result.errors)} errors")
    return {
        "chunks_found": len(result.chunks),
        "pages_crawled": result.total_pages,
        "errors": result.errors,
        "preview": [
            {"page": c.page_number, "chapter": c.chapter, "content": c.content[:200]}
            for c in result.chunks[:5]
        ]
    }

# ── Run ─────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("=" * 52)
    logger.info(f"  VinFast Car Assistant API")
    logger.info(f"  http://localhost:{PORT}")
    logger.info(f"  chunks: {len(KNOWLEDGE_BASE)} | provider: {LLM_PROVIDER} | model: {LLM_MODEL}")
    logger.info("=" * 52)
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
