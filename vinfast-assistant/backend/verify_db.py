"""
Kiểm tra dữ liệu đã upload lên PGVector chưa.
Run: python -m backend.verify_db
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from backend.db import get_pgvector_store, query_similar_vectors_from_pgvector

COLLECTION_NAME = os.getenv("COLLECTION_NAME", "vinfast_manual_vectors")

def main():
    vector_store = get_pgvector_store(COLLECTION_NAME)

    # Test query
    query = "cách khởi động xe VF8"
    print(f"\nTest query: '{query}'")
    results = query_similar_vectors_from_pgvector(query, vector_store, top_k=3)

    if not results:
        print("❌ Không tìm thấy kết quả — có thể chưa upload hoặc lỗi kết nối.")
        return

    print(f"✅ Tìm thấy {len(results)} kết quả:\n")
    for doc, score in results:
        print(f"  Score: {score:.4f}")
        print(f"  Car:   {doc.metadata.get('car_model')} | {doc.metadata.get('section')}")
        print(f"  Text:  {doc.page_content[:120]}...")
        print()

if __name__ == "__main__":
    main()
