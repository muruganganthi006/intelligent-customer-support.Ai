
from functools import lru_cache
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer


# Persistent ChromaDB storage directory
BACKEND_DIR = Path(__file__).resolve().parents[2]
CHROMA_DIR = BACKEND_DIR / "chroma_db"

COLLECTION_NAME = "intellisupport_knowledge"

# Lightweight local embedding model
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_embedding_model():
    """
    Load the embedding model once and reuse it.
    """
    return SentenceTransformer(
        EMBEDDING_MODEL_NAME,
        device="cpu"
    )


@lru_cache(maxsize=1)
def get_collection():
    """
    Create or connect to the persistent ChromaDB collection.
    """
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(
        path=str(CHROMA_DIR)
    )

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )

    return collection


def add_chunks(
    document_id: str,
    filename: str,
    chunks: list[str]
) -> int:
    """
    Generate embeddings and store document chunks.
    """

    if not chunks:
        raise ValueError("No text chunks were provided.")

    model = get_embedding_model()

    embeddings = model.encode(
        chunks,
        normalize_embeddings=True
    ).tolist()

    ids = [
        f"{document_id}_chunk_{index}"
        for index in range(len(chunks))
    ]

    metadatas = [
        {
            "document_id": document_id,
            "filename": filename,
            "chunk_index": index
        }
        for index in range(len(chunks))
    ]

    collection = get_collection()

    collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return len(chunks)


def search_chunks(
    query: str,
    n_results: int = 5
) -> list[dict]:
    """
    Search stored document chunks using semantic similarity.
    """

    if not query or not query.strip():
        raise ValueError("Search query cannot be empty.")

    if n_results < 1:
        raise ValueError("n_results must be at least 1.")

    collection = get_collection()

    total_chunks = collection.count()

    if total_chunks == 0:
        return []

    model = get_embedding_model()

    query_embedding = model.encode(
        [query],
        normalize_embeddings=True
    ).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(n_results, total_chunks),
        include=["documents", "metadatas", "distances"]
    )

    matches = []

    for index in range(len(results["ids"][0])):
        matches.append({
            "text": results["documents"][0][index],
            "metadata": results["metadatas"][0][index],
            "distance": results["distances"][0][index]
        })

    return matches


def delete_document(document_id: str) -> int:
    """
    Delete all stored chunks belonging to a document.
    """

    collection = get_collection()

    existing = collection.get(
        where={"document_id": document_id},
        include=[]
    )

    ids = existing["ids"]

    if ids:
        collection.delete(ids=ids)

    return len(ids)
