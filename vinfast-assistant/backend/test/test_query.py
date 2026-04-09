import sys
sys.path.insert(0, '.')

from db import get_pgvector_store, query_similar_vectors_from_pgvector
import os
os.chdir("D:/Github/Nhom_07_E402_Day05/vinfast-assistant/backend")

collection_name = os.getenv("COLLECTION_NAME", "vinfast_manual_vectors")
vector_store = get_pgvector_store(collection_name)

query = "VF 5 có những màu nào?"
results = query_similar_vectors_from_pgvector(query, vector_store, top_k=3)

print(f"\nQuery: {query}")
print(f"Found {len(results)} results:\n")
for i, (doc, score) in enumerate(results):
    print(f"--- Result {i+1} (score: {score:.4f}) ---")
    print(doc.page_content[:500])
    print()
