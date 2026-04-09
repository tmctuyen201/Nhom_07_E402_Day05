from dataclasses import dataclass
from typing import Any, Literal

@dataclass
class RetrievedChunk:
    chunk: "Chunk"
    score: float

@dataclass
class SynthesisResult:
    answer: str
    sources: list[dict]
    confidence: float
    car_model: str
    category: str | None = None
