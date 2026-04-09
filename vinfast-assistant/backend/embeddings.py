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
from .synthesizer import synthesize
from .synthesizer_types import SynthesisResult
from langchain_community.embeddings import HuggingFaceEmbeddings

_collection_name = os.getenv("COLLECTION_NAME", "vinfast_manual_vectors")
_vector_store = None
_embedding_model = None

def _get_embedding_model():
    """Get or initialize embedding model (singleton)."""
    global _embedding_model
    if _embedding_model is None:
        try:
            _embedding_model = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
            logger.info("✅ Embedding model loaded")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    return _embedding_model

def embed_query(query: str) -> List[float]:
    """
    Embedding hóa câu hỏi thành vector.
    
    Args:
        query: User query string (Vietnamese)
    
    Returns:
        Vector representation của query
    """
    try:
        model = _get_embedding_model()
        query_vector = model.embed_query(query)
        logger.info(f"✅ Embedded query: '{query[:40]}...' → {len(query_vector)}-dim vector")
        return query_vector
    except Exception as e:
        logger.error(f"Failed to embed query: {e}")
        raise

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


async def search_and_answer(
    query: str,
    car_model: str | None = None,
    conversation_history: list[dict] | None = None,
    api_key: str | None = None,
    top_k: int = 5,
    threshold: float = 0.1
) -> SynthesisResult:
    """
    End-to-end RAG flow:
    1. Retrieve top-K chunks from PGVector
    2. Synthesize answer using ChatGPT 4o with retrieved context
    3. Return answer with sources and confidence score
    
    Args:
        query: User question in Vietnamese
        car_model: Filter by car model ("VF8", "VF9", or None for all)
        conversation_history: Previous messages for context (role, content)
        api_key: OpenAI API key (required for synthesis)
        top_k: Number of top chunks to retrieve (default 5)
        threshold: Minimum similarity threshold (default 0.1)
    
    Returns:
        SynthesisResult with answer, sources, confidence, car_model, category
    """
    if not api_key:
        logger.error("OpenAI API key required for answer synthesis")
        raise ValueError("api_key is required")
    
    if conversation_history is None:
        conversation_history = []
    
    logger.info(f"🔍 Search & Answer: query='{query[:50]}...', car_model={car_model}")
    
    # Step 1: Retrieve relevant chunks
    retrieval_results = retrieve(
        query=query,
        car_model=car_model,
        top_k=top_k,
        threshold=threshold
    )
    
    if not retrieval_results:
        logger.warning("❌ No relevant chunks found. Returning empty answer.")
        return SynthesisResult(
            answer="Xin lỗi, tôi không tìm thấy thông tin liên quan để trả lời câu hỏi của bạn. Vui lòng liên hệ hotline VinFast 1900 232 389 để được hỗ trợ.",
            sources=[],
            confidence=0.0,
            car_model=car_model or "Unknown",
            category=None
        )
    
    logger.info(f"✅ Retrieved {len(retrieval_results)} chunks for synthesis")
    
    # Step 2: Synthesize answer using LLM
    result = await synthesize(
        query=query,
        context_chunks=retrieval_results,  # List of (Chunk, similarity_score) tuples
        car_model=car_model or "All",
        conversation_history=conversation_history,
        api_key=api_key
    )
    
    logger.info(f"✅ Answer synthesized: {len(result.answer)} chars, confidence={result.confidence:.2f}")
    return result
