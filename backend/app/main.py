import os
from pathlib import Path
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .models import (
    RetrievalRequest,
    RetrievalResponse,
    QueryRequest,
    QueryResponse,
    SettingsUpdateRequest,
    SystemSettings,
    DocumentMetadata,
    Chunk,
)
from .document_loader import DocumentLoader
from .rag_pipeline import pipeline

app = FastAPI(
    title="Naive RAG Studio API",
    description="Backend API for Naive Retrieval-Augmented Generation implementation in Python and React",
    version="1.0.0",
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Naive RAG Studio",
        "documents": len(pipeline.documents),
        "chunks": pipeline.vector_store.total_chunks,
    }


@app.get("/api/settings", response_model=SystemSettings)
def get_settings():
    return pipeline.get_settings()


@app.post("/api/settings", response_model=SystemSettings)
def update_settings(req: SettingsUpdateRequest):
    pipeline.update_settings(req)
    return pipeline.get_settings()


@app.get("/api/documents", response_model=List[DocumentMetadata])
def get_documents():
    return pipeline.get_documents()


@app.post("/api/documents/upload", response_model=List[DocumentMetadata])
async def upload_documents(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        try:
            content_bytes = await file.read()
            text = DocumentLoader.load_from_bytes(file.filename, content_bytes)
            if not text.strip():
                continue
            meta = pipeline.add_document(filename=file.filename, text=text)
            results.append(meta)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process file {file.filename}: {str(e)}")
    return results


@app.post("/api/documents/load-samples", response_model=List[DocumentMetadata])
def load_sample_documents():
    sample_dir = Path(__file__).parent.parent / "sample_docs"
    loaded = []
    if sample_dir.exists():
        for file_path in sample_dir.glob("*.txt"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
                # Check if already added
                if not any(d.filename == file_path.name for d in pipeline.get_documents()):
                    meta = pipeline.add_document(filename=file_path.name, text=text)
                    loaded.append(meta)
            except Exception as e:
                print(f"Error loading sample {file_path.name}: {e}")
    return loaded


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    pipeline.delete_document(doc_id)
    return {"status": "deleted", "doc_id": doc_id}


@app.delete("/api/documents")
def clear_all_documents():
    pipeline.reset()
    return {"status": "reset_successful"}


@app.get("/api/chunks", response_model=List[Chunk])
def get_all_chunks():
    return pipeline.get_chunks()


@app.post("/api/retrieve", response_model=RetrievalResponse)
def retrieve_chunks(req: RetrievalRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    results, latency = pipeline.retrieve(
        query=req.query,
        top_k=req.top_k,
        similarity_threshold=req.similarity_threshold,
    )
    return RetrievalResponse(
        query=req.query,
        results=results,
        latency_ms=latency,
    )


@app.post("/api/query", response_model=QueryResponse)
def answer_query(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return pipeline.answer_query(
        query=req.query,
        top_k=req.top_k,
        similarity_threshold=req.similarity_threshold,
        compare_without_rag=req.compare_without_rag or False,
    )

