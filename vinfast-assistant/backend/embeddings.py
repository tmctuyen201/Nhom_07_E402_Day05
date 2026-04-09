"""
TF-IDF Embeddings + Cosine Similarity Retrieval
No external API needed — pure Python with scikit-learn.
"""
import math
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .knowledge_base import KNOWLEDGE_BASE, Chunk

# Build corpus texts and fit vectorizer once
_CORPUS = [chunk.content for chunk in KNOWLEDGE_BASE]
_VECTORIZER = TfidfVectorizer(max_features=500, stop_words="english", ngram_range=(1, 2))
_MATRIX = _VECTORIZER.fit_transform(_CORPUS)  # shape: (n_chunks, n_features)

def compute_embedding(text: str) -> list[float]:
    """Transform query text into TF-IDF vector."""
    vec = _VECTORIZER.transform([text]).toarray()[0]
    norm = math.sqrt(sum(v * v for v in vec))
    norm = norm or 1.0
    return [v / norm for v in vec]

def cosine_similarity_vec(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    return dot / (mag_a * mag_b + 1e-10)

def retrieve(query: str, car_model: str | None = None, top_k: int = 5, threshold: float = 0.1) -> list[tuple[Chunk, float]]:
    """Retrieve top-K chunks above similarity threshold."""
    query_vec = compute_embedding(query)
    chunks = KNOWLEDGE_BASE
    if car_model:
        chunks = [c for c in chunks if c.car_model.lower() == car_model.lower()]

    results: list[tuple[Chunk, float]] = []
    for i, chunk in enumerate(chunks):
        chunk_vec = _MATRIX[i].toarray()[0]
        norm = math.sqrt(sum(v * v for v in chunk_vec))
        norm = norm or 1.0
        dense = [v / norm for v in chunk_vec]
        score = cosine_similarity_vec(query_vec, dense)
        if score >= threshold:
            results.append((chunk, score))

    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_k]
