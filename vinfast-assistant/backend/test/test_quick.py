"""
⚡ Quick Test - PGVector + Reranking Flow
Run: cd vinfast-assistant && python -m backend.test_quick
"""
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / "config" / ".env"
load_dotenv(dotenv_path=env_path)
sys.path.insert(0, str(Path(__file__).parent.parent))

async def main():
    from backend.rag.embeddings import search_and_answer
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Missing OPENAI_API_KEY in .env")
        return
    
    query = "Cách khởi động xe VF8?"
    print(f"\n🔍 Query: {query}")
    print("⏳ Processing...\n")
    
    result = await search_and_answer(
        query=query,
        car_model="VF8",
        api_key=api_key,
        top_k=3,
        use_rerank=True
    )
    
    print("✅ ANSWER:")
    print("-" * 60)
    print(result.answer)
    print("-" * 60)
    print(f"\n📊 Confidence: {result.confidence:.0%} | Sources: {len(result.sources)}")

if __name__ == "__main__":
    asyncio.run(main())
