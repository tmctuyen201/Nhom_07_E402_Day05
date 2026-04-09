"""
🧪 Test PGVector + Reranking + GPT-4o Flow
Run: cd vinfast-assistant && python -m backend.test_pgvector_rerank
"""
import asyncio
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Load config
env_path = Path(__file__).parent / "config" / ".env"
load_dotenv(dotenv_path=env_path)
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.rag.embeddings import search_and_answer

async def test_single_query(query: str, car_model: str = "VF8"):
    """Test a single query through the full RAG pipeline."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ OPENAI_API_KEY not found in .env")
        return
    
    print("\n" + "="*70)
    print(f"🚀 Testing PGVector + Reranking + GPT-4o Flow")
    print("="*70)
    print(f"  📝 Query: {query}")
    print(f"  🚗 Car Model: {car_model}")
    print(f"  🤖 LLM: GPT-4o-mini")
    print(f"  🔄 Reranking: Enabled (top-3)")
    print("="*70)
    
    start_time = time.time()
    
    try:
        # Call search_and_answer with reranking
        result = await search_and_answer(
            query=query,
            car_model=car_model,
            conversation_history=[],
            api_key=api_key,
            top_k=3,  # Rerank to top-3
            threshold=0.1,
            use_rerank=True
        )
        
        total_time = time.time() - start_time
        
        print(f"\n⏱️  PERFORMANCE: {total_time:.2f}s")
        print("="*70)
        
        print(f"\n✅ ANSWER:")
        print("="*70)
        print(result.answer)
        
        print(f"\n📊 METADATA:")
        print("="*70)
        print(f"  🚗 Car Model: {result.car_model}")
        print(f"  📂 Category: {result.category}")
        print(f"  📈 Confidence: {result.confidence:.2%}")
        print(f"  📚 Sources: {len(result.sources)} chunks")
        
        if result.sources:
            print(f"\n📖 SOURCES (Top-{len(result.sources)} after reranking):")
            print("="*70)
            for i, src in enumerate(result.sources, 1):
                print(f"\n  [{i}] 📄 Trang {src['pageNumber']} - {src['chapter']}")
                print(f"      📍 Section: {src['section']}")
                print(f"      📝 Excerpt: {src['excerpt'][:100]}...")
        
        print("\n" + "="*70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def test_multiple_queries():
    """Test multiple queries to verify consistency."""
    test_cases = [
        ("Cách khởi động xe VF8 như thế nào?", "VF8"),
        ("Hướng dẫn sạc pin VF9", "VF9"),
        ("Đèn cảnh báo phanh sáng nghĩa là gì?", "VF8"),
        ("Tính năng ADAS trên VF8 có gì?", "VF8"),
    ]
    
    print("\n" + "="*70)
    print("🧪 Running Multiple Test Cases")
    print("="*70)
    
    for i, (query, car_model) in enumerate(test_cases, 1):
        print(f"\n\n{'='*70}")
        print(f"Test Case {i}/{len(test_cases)}")
        print(f"{'='*70}")
        await test_single_query(query, car_model)
        
        if i < len(test_cases):
            print("\n⏳ Waiting 2s before next test...")
            await asyncio.sleep(2)

async def main():
    """Main entry point."""
    import sys
    
    if len(sys.argv) > 1:
        # Single query mode
        query = " ".join(sys.argv[1:])
        await test_single_query(query)
    else:
        # Multiple queries mode
        await test_multiple_queries()

if __name__ == "__main__":
    asyncio.run(main())
