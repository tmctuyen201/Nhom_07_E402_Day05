"""Shared data types across the backend."""
from dataclasses import dataclass, field
from typing import Literal, Optional


@dataclass
class RetrievedChunk:
    chunk: object   # DBChunk or Chunk
    score: float


@dataclass
class SynthesisResult:
    answer: str
    sources: list[dict]
    confidence: float
    car_model: str
    category: Optional[str] = None
    # When the LLM triggers a location tool, signal the frontend
    tool_action: Optional[dict] = None  # e.g. {"tool": "find_stations", "type": "charging"}


# Tool types the LLM can trigger
ToolName = Literal[
    "get_warning_light_info",
    "get_adas_feature_info",
    "get_charging_guide",
    "find_nearby_stations",   # charging OR service center
]
