# pip install langchain-postgres langchain-huggingface python-dotenv psycopg-binary sentence-transformers
import os
from typing import List

from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from dotenv import load_dotenv
from urllib.parse import quote_plus
load_dotenv(dotenv_path="./config/.env")


def create_pgvector_store(
    collection_name: str,
    documents: List[Document] = None
) -> PGVector:
    """
    Tạo mới PGvector store và lưu documents nếu có.
    """
    print("Creating PGvector store...")

    db_user = os.getenv("POSTGRES_USER")
    db_password = quote_plus(os.getenv("POSTGRES_PASSWORD"))
    db_name = os.getenv("POSTGRES_DB")
    db_host = os.getenv("POSTGRES_HOST")
    db_port = os.getenv("POSTGRES_PORT")
    
    if not all([db_user, db_password, db_name]):
        raise ValueError("Pls provide POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB in .env")

    connection_string = f"postgresql+psycopg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}?sslmode=require"
    print(f"Connecting to PGvector with database '{db_name}'...")

    try:
        embedding_model = HuggingFaceEmbeddings(
            model_name=os.getenv("MODEL_NAME_EMBED"),
            model_kwargs={'device': 'cpu'}
        )

        vector_store = PGVector.from_documents(
            embedding=embedding_model,
            documents=documents or [],
            collection_name=collection_name,
            connection=connection_string,
            use_jsonb=True,
            create_extension_if_not_exists=True
        )
        print("✅ PGVector store created successfully!")
        return vector_store

    except Exception as e:
        print(f"❌ Error creating PGvector store: {e}")
        raise


def get_pgvector_store(collection_name: str) -> PGVector:
    """
    Kết nối đến PGvector và trả về một đối tượng vector store đã tồn tại.
    """
    print("Connecting to PGvector...")

    db_user = os.getenv("POSTGRES_USER")
    raw_password = os.getenv("POSTGRES_PASSWORD")
    db_name = os.getenv("POSTGRES_DB")
    db_host = os.getenv("POSTGRES_HOST")
    db_port = os.getenv("POSTGRES_PORT")
    print(db_host)
    if not all([db_user, raw_password, db_name]):
        raise ValueError("Pls provide POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB in .env")

    db_password = quote_plus(raw_password)

    # Resolve hostname to IP first to avoid DNS issues
    import socket
    try:
        ip_address = socket.getaddrinfo(db_host, int(db_port), socket.AF_INET)[0][4][0]
        print(f"✅ Resolved {db_host} → {ip_address}")
        connection_host = ip_address
    except Exception as dns_err:
        print(f"⚠️ DNS resolution failed: {dns_err}, using hostname directly")
        connection_host = db_host
    
    connection_string = f"postgresql+psycopg://{db_user}:{db_password}@{connection_host}:{db_port}/{db_name}?sslmode=require&connect_timeout=30&keepalives=1&keepalives_idle=30"
    print(f"Connecting to PGvector with database '{db_name}'...")

    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        
        embedding_model = HuggingFaceEmbeddings(
            model_name=os.getenv("MODEL_NAME_EMBED"),
            model_kwargs={'device': 'cpu'}
        )

        vector_store = PGVector(
            embeddings=embedding_model,
            collection_name=collection_name,
            connection=connection_string,
        )
        print("✅ Connection and PGVector store initialization successful!")
        return vector_store

    except Exception as e:
        print(f"❌ Error connecting to PGvector: {e}")
        raise

def store_documents_in_pgvector(
    documents_to_store: List[Document],
    vector_store: PGVector
):
    """
    Lưu trữ các document vào PGvector.
    """
    if not documents_to_store:
        print("Không có document nào để lưu trữ.")
        return

    collection_name = vector_store.collection_name
    print(f"Saving {len(documents_to_store)} document into collection '{collection_name}'...")
    
    try:
        # Hàm add_documents sẽ thêm các document vào database
        vector_store.add_documents(documents_to_store)
        print(f"✅ Successfully saved documents.")
    except Exception as e:
        print(f"❌ Error saving documents to PGvector: {e}")


def query_similar_vectors_from_pgvector(
    query: str,
    vector_store: PGVector,
    top_k: int = 5
) -> List[Document]:
    """
    Truy vấn các document tương tự từ PGvector.
    Embedding query tự động via LangChain.
    """
    try:
        print(f"🔍 Embedding query: '{query[:50]}...'")
        # LangChain tự động embedding query bằng embedding_model rồi search
        results_with_scores = vector_store.similarity_search_with_score(query=query, k=top_k)
        print(f"✅ Found {len(results_with_scores)} similar chunks from DB")
        return results_with_scores
    except Exception as e:
        print(f"❌ Error querying vector: {e}")
        return []


