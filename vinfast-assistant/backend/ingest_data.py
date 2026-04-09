import json
import os
from langchain_core.documents import Document
from db import create_pgvector_store
from dotenv import load_dotenv

load_dotenv(dotenv_path="./config/.env")

def load_knowledge_base_articles(json_path: str) -> list[Document]:
    with open(json_path, "r", encoding="utf-8") as f:
        articles = json.load(f)
    
    documents = []
    for article in articles:
        doc = Document(
            page_content=article["content"],
            metadata={
                "id": article["id"],
                "chapter": article.get("chapter", ""),
                "section": article.get("section", ""),
                "car_model": article.get("car_model", ""),
                "category": article.get("category", ""),
                "source_file": article.get("source_file", "")
            }
        )
        documents.append(doc)
    
    return documents

def main():
    json_path = os.path.join(os.path.dirname(__file__), "..", "knowledge_base_articles.json")
    json_path = os.path.abspath(json_path)
    
    print(f"Loading knowledge base from: {json_path}")
    documents = load_knowledge_base_articles(json_path)
    print(f"Loaded {len(documents)} documents")
    
    collection_name = os.getenv("COLLECTION_NAME", "vinfast_manual_vectors")
    print(f"Creating PGVector collection: {collection_name}")
    
    vector_store = create_pgvector_store(collection_name, documents)
    
    print("Done!")

if __name__ == "__main__":
    main()
