"""
Embedding Retrieval using PGVector + Reranking
Flow: User query → Embed → PGVector search → Rerank top-3 → GPT-4o synthesis
"""
import logging
import os
from typing import List, Tuple
from dotenv import load_dotenv

load_dotenv(dotenv_path="./config/.env")

logger = logging.getLogger("vinfast")

from .knowledge_base import Chunk
from ..llm.openai import synthesize
from ..core.types import SynthesisResult
from langchain_community.embeddings import HuggingFaceEmbeddings

_collection_name = os.getenv("COLLECTION_NAME", "vinfast_manual_vectors")
_vector_store = None
_embedding_model = None

def _get_embedding_model():
    """Get or initialize embedding model (singleton) - optimized for user input."""
    global _embedding_model
    if _embedding_model is None:
        try:
            model_name = os.getenv("MODEL_NAME_EMBED", "sentence-transformers/all-MiniLM-L6-v2")
            _embedding_model = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={'device': 'cpu'}
            )
            logger.info(f"✅ Embedding model loaded: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    return _embedding_model

def embed_query(query: str) -> List[float]:
    """
    Embedding hóa câu hỏi thành vector - optimized for fast user input.
    
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
        logger.error(f"❌ Failed to embed query: {e}")
        raise

def _get_vector_store():
    """Get or initialize PGVector store (singleton) with fallback."""
    global _vector_store
    if _vector_store is None:
        try:
            from ..db import get_pgvector_store
            _vector_store = get_pgvector_store(_collection_name)
            logger.info(f"✅ Connected to PGVector collection: {_collection_name}")
        except Exception as e:
            logger.warning(f"⚠️ PGVector unavailable: {e}")
            logger.info("📦 Falling back to local SQLite DB")
            # Will use fallback in retrieve()
            _vector_store = None
    return _vector_store

def _rerank_chunks(query: str, chunks: List[Tuple[Chunk, float]], top_k: int = 3) -> List[Tuple[Chunk, float]]:
    """
    Rerank retrieved chunks using cross-encoder for better relevance.
    Returns top-K reranked chunks.
    """
    if len(chunks) <= top_k:
        return chunks
    
    try:
        from sentence_transformers import CrossEncoder
        
        # Load cross-encoder model for reranking
        reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        
        # Prepare pairs for reranking
        pairs = [[query, chunk.content] for chunk, _ in chunks]
        
        # Get reranking scores
        rerank_scores = reranker.predict(pairs)
        
        # Combine with original chunks
        reranked = [(chunk, float(score)) for (chunk, _), score in zip(chunks, rerank_scores)]
        
        # Sort by rerank score (descending)
        reranked.sort(key=lambda x: x[1], reverse=True)
        
        logger.info(f"✅ Reranked {len(chunks)} → top-{top_k} chunks")
        return reranked[:top_k]
        
    except Exception as e:
        logger.warning(f"⚠️ Reranking failed, using original order: {e}")
        return chunks[:top_k]

def retrieve(query: str, car_model: str | None = None, top_k: int = 5, threshold: float = 0.1, use_rerank: bool = True) -> List[Tuple[Chunk, float]]:
    """
    Retrieve top-K chunks with optional reranking.
    MUST use PGVector - no fallback to SQLite.
    """
    vs = _get_vector_store()
    
    if vs is None:
        logger.error("❌ PGVector connection required but unavailable!")
        raise ConnectionError("PGVector database connection failed. Please check POSTGRES_* environment variables.")
    
    # Use PGVector
    fetch_k = top_k * 4 if use_rerank else top_k * 2
    
    from ..db import query_similar_vectors_from_pgvector
    results_with_scores = query_similar_vectors_from_pgvector(
        query=query,
        vector_store=vs,
        top_k=fetch_k
    )
    
    if not results_with_scores:
        logger.warning(f"⚠️ No results found for query: {query[:50]}")
        return []
    
    # Convert to Chunk objects
    results: List[Tuple[Chunk, float]] = []
    for doc, score in results_with_scores:
        # Convert distance to similarity (lower distance = higher similarity)
        similarity = 1 / (1 + score)
        
        if similarity < threshold:
            continue
        
        metadata = doc.metadata or {}
        chunk_car_model = metadata.get("car_model", "")
        
        # Filter by car model if specified
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
    
    if not results:
        logger.warning(f"⚠️ No chunks passed threshold={threshold}")
        return []
    
    # Rerank if enabled
    if use_rerank and len(results) > top_k:
        results = _rerank_chunks(query, results, top_k=top_k)
    else:
        results.sort(key=lambda x: x[1], reverse=True)
        results = results[:top_k]
    
    logger.info(f"✅ Retrieved {len(results)} chunks from PGVector (rerank={use_rerank}, car_model={car_model})")
    return results


async def search_and_answer(
    query: str,
    car_model: str | None = None,
    conversation_history: list[dict] | None = None,
    api_key: str | None = None,
    top_k: int = 3,
    threshold: float = 0.1,
    use_rerank: bool = True
) -> SynthesisResult:
    """
    🚀 End-to-end RAG flow with PGVector + Reranking + GPT-4o:
    
    1. User query → Embed query (HuggingFace)
    2. Search PGVector (similarity search)
    3. Rerank top candidates (cross-encoder)
    4. Synthesize answer (GPT-4o with context)
    5. Return answer with sources
    
    Args:
        query: User question in Vietnamese
        car_model: Filter by car model ("VF8", "VF9", or None for all)
        conversation_history: Previous messages for context (role, content)
        api_key: OpenAI API key (required for synthesis)
        top_k: Number of top chunks after reranking (default 3)
        threshold: Minimum similarity threshold (default 0.1)
        use_rerank: Enable cross-encoder reranking (default True)
    
    Returns:
        SynthesisResult with answer, sources, confidence, car_model, category
    """
    if not api_key:
        logger.error("❌ OpenAI API key required for answer synthesis")
        raise ValueError("api_key is required")
    
    if conversation_history is None:
        conversation_history = []
    
    logger.info(f"🔍 Search & Answer: query='{query[:50]}...', car_model={car_model}, rerank={use_rerank}")
    
    # Step 1: Retrieve relevant chunks from PGVector
    retrieval_results = retrieve(
        query=query,
        car_model=car_model,
        top_k=top_k,
        threshold=threshold,
        use_rerank=use_rerank
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
    
    logger.info(f"✅ Retrieved {len(retrieval_results)} chunks for synthesis (reranked={use_rerank})")
    
    # Step 2: Synthesize answer using GPT-4o
    result = await synthesize(
        query=query,
        context_chunks=retrieval_results,  # List of (Chunk, similarity_score) tuples
        car_model=car_model or "All",
        conversation_history=conversation_history,
        api_key=api_key
    )
    
    logger.info(f"✅ Answer synthesized: {len(result.answer)} chars, confidence={result.confidence:.2f}")
    return result
