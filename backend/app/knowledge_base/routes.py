
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.knowledge_base.document_processor import extract_text
from app.knowledge_base.text_chunker import split_text
from app.knowledge_base.vector_store import add_chunks, search_chunks
from app.knowledge_base.rag_service import generate_rag_answer


# Initialize router
router = APIRouter(
    prefix="/api/knowledge-base",
    tags=["Knowledge Base"]
)


# Directory configuration
BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_DIR / "uploads"

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024


# Request schemas
class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=10)


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=10)


# --------------------------------------------------
# 1. DOCUMENT UPLOAD API
# --------------------------------------------------

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided."
        )

    original_filename = Path(file.filename).name
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, and TXT files are supported."
        )

    document_id = str(uuid4())

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    saved_path = UPLOAD_DIR / f"{document_id}{extension}"

    try:
        contents = await file.read(MAX_FILE_SIZE + 1)

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty."
            )

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File size exceeds 10 MB."
            )

        saved_path.write_bytes(contents)

        extracted_text = extract_text(str(saved_path))
        chunks = split_text(extracted_text)

        if not chunks:
            raise ValueError("No readable text was found.")

        stored_count = add_chunks(
            document_id=document_id,
            filename=original_filename,
            chunks=chunks
        )

        return {
            "message": "Document uploaded and indexed successfully.",
            "document_id": document_id,
            "filename": original_filename,
            "chunks_created": stored_count,
            "status": "indexed"
        }

    except HTTPException:
        saved_path.unlink(missing_ok=True)
        raise

    except Exception as error:
        saved_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(error)}"
        )

    finally:
        await file.close()


# --------------------------------------------------
# 2. SEMANTIC DOCUMENT SEARCH API
# --------------------------------------------------

@router.post("/search")
def search_knowledge_base(request: SearchRequest):

    try:
        results = search_chunks(
            query=request.query,
            n_results=request.top_k
        )

        return {
            "query": request.query,
            "total_results": len(results),
            "results": [
                {
                    "text": result["text"],
                    "filename": result["metadata"]["filename"],
                    "document_id": result["metadata"]["document_id"],
                    "chunk_index": result["metadata"]["chunk_index"],
                    "distance": result["distance"]
                }
                for result in results
            ]
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Knowledge base search failed: {str(error)}"
        )


# --------------------------------------------------
# 3. RAG AI QUESTION-ANSWERING API
# --------------------------------------------------

@router.post("/ask")
def ask_knowledge_base(request: AskRequest):

    try:
        result = generate_rag_answer(
            question=request.question,
            top_k=request.top_k
        )

        return {
            "question": request.question,
            "answer": result["answer"],
            "sources": result["sources"],
            "model": result["model"]
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI assistant error: {str(error)}"
        )
