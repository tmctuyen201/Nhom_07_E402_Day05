#!/usr/bin/env python3
"""
🚀 VinFast Query Embedding Tool
Tối ưu hóa để user nhập câu hỏi và embedding nhanh chóng.

Usage:
    cd vinfast-assistant && python backend/embed_query_tool.py

Features:
- ✅ Input validation
- ✅ Model caching (load 1 lần duy nhất)
- ✅ Async processing cho tốc độ
- ✅ Clean output
- ✅ Error handling
"""

import asyncio
import sys
import time
from pathlib import Path
from typing import List

# Load config
env_path = Path(__file__).parent / "config" / ".env"
from dotenv import load_dotenv
load_dotenv(dotenv_path=env_path)
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.embeddings import embed_query

class QueryEmbedder:
    """Optimized query embedding tool với caching và async."""

    def __init__(self):
        self.model_loaded = False
        self.load_start_time = None

    async def initialize_model(self):
        """Pre-load embedding model để tối ưu tốc độ."""
        if not self.model_loaded:
            print("🔄 Loading embedding model...")
            self.load_start_time = time.time()

            # Force load model bằng cách import và init
            from backend.embeddings import _get_embedding_model
            _get_embedding_model()  # This will load the model

            load_time = time.time() - self.load_start_time
            print(f"✅ Model loaded in {load_time:.2f}s")
            self.model_loaded = True

    async def embed_user_query(self, query: str) -> List[float]:
        """Embed câu hỏi của user với tối ưu performance."""
        if not query.strip():
            raise ValueError("❌ Query không được để trống!")

        print(f"\n🔍 Embedding: '{query}'")
        start_time = time.time()

        # Run embedding trong thread pool để không block
        vector = await asyncio.get_event_loop().run_in_executor(None, embed_query, query)

        embed_time = time.time() - start_time
        print(f"⚡ Embedded in {embed_time:.3f}s")
        print(f"   📊 Vector shape: {len(vector)}-dim")
        print(f"   🔢 Sample values: [{vector[0]:.4f}, {vector[1]:.4f}, {vector[2]:.4f}, ...]")

        return vector

    async def interactive_mode(self):
        """Interactive mode để user nhập câu hỏi liên tục."""
        print("\n" + "="*60)
        print("🚗 VinFast Query Embedding Tool")
        print("="*60)
        print("📝 Nhập câu hỏi (hoặc 'quit' để thoát):")

        await self.initialize_model()

        # Check if input is piped (Windows compatible)
        try:
            import msvcrt
            is_piped = not msvcrt.kbhit() and sys.stdin.readable()
        except ImportError:
            # Unix-like systems
            import select
            is_piped = bool(select.select([sys.stdin], [], [], 0.0)[0])

        if is_piped:
            # Piped input
            piped_input = sys.stdin.read().strip()
            if piped_input:
                await self.embed_user_query(piped_input)
            return

        # Interactive input
        while True:
            try:
                query = input("\n❓ Câu hỏi: ").strip()

                if query.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break

                await self.embed_user_query(query)

            except KeyboardInterrupt:
                print("\n👋 Đã dừng!")
                break
            except Exception as e:
                print(f"❌ Lỗi: {e}")

async def main():
    """Main entry point."""
    embedder = QueryEmbedder()

    if len(sys.argv) > 1:
        # Command line mode: python embed_query_tool.py "câu hỏi"
        query = " ".join(sys.argv[1:])
        await embedder.initialize_model()
        await embedder.embed_user_query(query)
    else:
        # Interactive mode
        await embedder.interactive_mode()

if __name__ == "__main__":
    asyncio.run(main())
