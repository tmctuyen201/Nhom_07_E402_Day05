"""
DB-backed RAG retrieval.
Reads chunks from SQLite (built by ingest.py) at query time.
Falls back to hardcoded KNOWLEDGE_BASE if DB not found.
"""
import json
import math
import pickle
import sqlite3
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger("vinfast")

DB_PATH = Path(__file__).parent.parent / "rag.db"


@dataclass
class DBChunk:
    id: str
    source: str
    car_model: str
    lang: str
    section: str
    content: str
    # Compat fields for synthesizer
    page_number: int = 0
    chapter: str = ""
    category: str = "general"

    def __post_init__(self):
        self.chapter = self.section
        self.category = "general"


# ── Lazy-loaded model cache ───────────────────────────────────
_cache: dict = {}


def _load_model():
    if _cache:
        return _cache
    if not DB_PATH.exists():
        logger.warning(f"RAG DB not found at {DB_PATH}. Run: python -m backend.rag.ingest")
        return {}
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT vectorizer, matrix, chunk_ids FROM tfidf_model LIMIT 1").fetchone()
    if not row:
        conn.close()
        return {}
    vectorizer = pickle.loads(row[0])
    matrix = pickle.loads(row[1])
    chunk_ids = json.loads(row[2])

    # Load all chunks into memory dict
    rows = conn.execute("SELECT id, source, car_model, lang, section, content FROM chunks").fetchall()
    conn.close()

    chunks_by_id = {
        r[0]: DBChunk(id=r[0], source=r[1], car_model=r[2], lang=r[3], section=r[4], content=r[5])
        for r in rows
    }

    _cache["vectorizer"] = vectorizer
    _cache["matrix"] = matrix
    _cache["chunk_ids"] = chunk_ids
    _cache["chunks"] = chunks_by_id
    logger.info(f"RAG DB loaded: {len(chunks_by_id)} chunks")
    return _cache


def _cosine(a, b_row) -> float:
    import numpy as np
    a_arr = a.toarray()[0]
    b_arr = b_row.toarray()[0]
    dot = float(a_arr @ b_arr)
    mag_a = math.sqrt(float(a_arr @ a_arr))
    mag_b = math.sqrt(float(b_arr @ b_arr))
    return dot / (mag_a * mag_b + 1e-10)


def retrieve_from_db(
    query: str,
    car_model: Optional[str] = None,
    top_k: int = 5,
    threshold: float = 0.05,
) -> list[tuple[DBChunk, float]]:
    """Retrieve top-K chunks from DB using TF-IDF cosine similarity."""
    model = _load_model()
    if not model:
        # Fallback to hardcoded KB
        logger.warning("Falling back to hardcoded knowledge base")
        from .embeddings import retrieve as kb_retrieve
        from .knowledge_base import KNOWLEDGE_BASE  # noqa
        results = kb_retrieve(query, car_model=car_model, top_k=top_k, threshold=threshold)
        # Wrap in DBChunk-compatible objects
        return [
            (DBChunk(
                id=c.id, source="knowledge_base.py", car_model=c.car_model,
                lang="en", section=c.section, content=c.content,
                page_number=c.page_number, chapter=c.chapter, category=c.category
            ), score)
            for c, score in results
        ]

    vectorizer = model["vectorizer"]
    matrix = model["matrix"]
    chunk_ids = model["chunk_ids"]
    chunks_by_id = model["chunks"]

    query_vec = vectorizer.transform([query])

    # Filter by car model if specified
    if car_model:
        cm = car_model.upper().replace(" ", "")
        indices = [
            i for i, cid in enumerate(chunk_ids)
            if cid in chunks_by_id and chunks_by_id[cid].car_model.upper().replace(" ", "") == cm
        ]
    else:
        indices = list(range(len(chunk_ids)))

    results = []
    for i in indices:
        score = _cosine(query_vec, matrix[i])
        if score >= threshold:
            cid = chunk_ids[i]
            if cid in chunks_by_id:
                results.append((chunks_by_id[cid], score))

    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_k]


def db_exists() -> bool:
    return DB_PATH.exists()


def db_stats() -> dict:
    if not DB_PATH.exists():
        return {"status": "not_found", "chunks": 0}
    conn = sqlite3.connect(DB_PATH)
    total = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    by_model = dict(conn.execute("SELECT car_model, COUNT(*) FROM chunks GROUP BY car_model").fetchall())
    by_lang = dict(conn.execute("SELECT lang, COUNT(*) FROM chunks GROUP BY lang").fetchall())
    conn.close()
    return {"status": "ok", "chunks": total, "by_model": by_model, "by_lang": by_lang}
