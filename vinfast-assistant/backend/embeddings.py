"""
Embedding Retrieval using PGVector + Supabase
"""
import logging
import os
from typing import List, Tuple
from dotenv import load_dotenv

load_dotenv(dotenv_path="./config/.env")

logger = logging.getLogger("vinfast")

from .db import get_pgvector_store, query_similar_vectors_from_pgvector
from .knowledge_base import Chunk

_collection_name = os.getenv("COLLECTION_NAME", "vinfast_manual_vectors")
_vector_store = None

def _get_vector_store():
    global _vector_store
    if _vector_store is None:
        try:
            _vector_store = get_pgvector_store(_collection_name)
            logger.info(f"Connected to PGVector collection: {_collection_name}")
        except Exception as e:
            logger.error(f"Failed to connect to PGVector: {e}")
            raise
    return _vector_store

def retrieve(query: str, car_model: str | None = None, top_k: int = 5, threshold: float = 0.1) -> List[Tuple[Chunk, float]]:
    """Retrieve top-K chunks from PGVector above similarity threshold."""
    try:
        vs = _get_vector_store()
    except Exception as e:
        logger.error(f"Vector store unavailable: {e}")
        return []
    
    fetch_k = top_k * 3 if car_model else top_k * 2
    
    results_with_scores = query_similar_vectors_from_pgvector(
        query=query,
        vector_store=vs,
        top_k=fetch_k
    )
    
    if not results_with_scores:
        logger.warning(f"No results found for query: {query[:50]}")
        return []
    
    results: List[Tuple[Chunk, float]] = []
    for doc, score in results_with_scores:
        similarity = 1 / (1 + score)
        
        if similarity < threshold:
            continue
        
        metadata = doc.metadata or {}
        chunk_car_model = metadata.get("car_model", "")
        
        if car_model and chunk_car_model.lower() != car_model.lower():
            continue
        
        chunk = Chunk(
            id=metadata.get("id", ""),
            page_number=metadata.get("page_number", 0),
            chapter=metadata.get("chapter", ""),
            section=metadata.get("section", ""),
            content=doc.page_content,
            car_model=chunk_car_model,
            category=metadata.get("category", "")
        )
        results.append((chunk, similarity))
    
    results.sort(key=lambda x: x[1], reverse=True)
    logger.info(f"Retrieved {len(results)}/{fetch_k} chunks (top_k={top_k}, car_model={car_model})")
    return results[:top_k]
