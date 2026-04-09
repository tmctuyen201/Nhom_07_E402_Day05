"""
Test end-to-end search & answer flow with ChatGPT 4o synthesis.
Run: cd vinfast-assistant && python -m backend.test_search_answer
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

from backend.embeddings import search_and_answer

async def main():
    # Configuration
    query = "Cách khởi động xe VF8 như thế nào?"
    car_model = "VF8"
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ OPENAI_API_KEY not found in .env")
        return
    
    print(f"\n🚀 Starting end-to-end RAG test")
    print(f"  Query: {query}")
    print(f"  Car Model: {car_model}")
    print(f"  LLM: ChatGPT 4o (configured in config.py)\n")
    
    start_time = time.time()
    
    try:
        # Call search_and_answer
        result = await search_and_answer(
            query=query,
            car_model=car_model,
            conversation_history=[],
            api_key=api_key,
            top_k=3,
            threshold=0.1
        )
        total_time = time.time() - start_time
        
        print("=" * 60)
        print(f"⏱️ PERFORMANCE: {total_time:.2f}s")
        print("=" * 60)
        print()
        
        print("=" * 60)
        print("✅ ANSWER:")
        print("=" * 60)
        print(result.answer)
        print()
        
        print("=" * 60)
        print(f"📊 METADATA:")
        print("=" * 60)
        print(f"  Car Model: {result.car_model}")
        print(f"  Category: {result.category}")
        print(f"  Confidence: {result.confidence:.2%}")
        print(f"  Sources: {len(result.sources)} chunks")
        print()
        
        if result.sources:
            print("=" * 60)
            print("📖 SOURCES:")
            print("=" * 60)
            for i, src in enumerate(result.sources, 1):
                print(f"\n  [{i}] Trang {src['pageNumber']} - {src['chapter']} > {src['section']}")
                print(f"      Excerpt: {src['excerpt']}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
