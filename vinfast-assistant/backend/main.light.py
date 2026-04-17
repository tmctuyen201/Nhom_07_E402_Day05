#!/usr/bin/env python3
"""
Minimal VinFast Assistant for fast Railway deployment
Removes heavy ML dependencies for quicker builds
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
import time
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
PORT = int(os.getenv("PORT", "8000"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "")

# Create FastAPI app
app = FastAPI(title="VinFast Assistant - Light", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# Mock responses for fast deployment
MOCK_RESPONSES = {
    "charging": "You can find charging stations using the navigation system or VinFast app.",
    "maintenance": "Schedule maintenance through the VinFast app or contact your dealer.",
    "features": "Your VF8/VF9 includes autonomous driving, premium audio, and smart connectivity.",
    "default": "I'm here to help with your VinFast vehicle. How can I assist you today?",
}


class AgentRequest(BaseModel):
    query: str
    car_model: str = "VF8"


@app.get("/")
def root():
    return {"message": "VinFast Assistant - Light Version", "status": "running"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0-light",
        "uptime_seconds": time.time(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/ready")
def ready():
    return {"ready": True}


@app.post("/api/agent")
async def agent(req: AgentRequest):
    """Lightweight agent with mock responses"""
    query_lower = req.query.lower()

    # Simple keyword matching for mock responses
    if "charg" in query_lower:
        response = MOCK_RESPONSES["charging"]
    elif "maintain" in query_lower or "service" in query_lower:
        response = MOCK_RESPONSES["maintenance"]
    elif "feature" in query_lower:
        response = MOCK_RESPONSES["features"]
    else:
        response = MOCK_RESPONSES["default"]

    return {
        "text": response,
        "agent": "light-assistant",
        "sources": [],
        "confidence": 0.8,
        "category": "general",
        "tool_action": None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
