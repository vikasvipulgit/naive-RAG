from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Chunk(BaseModel):
    id: str
    doc_id: str
    filename: str
    chunk_index: int
    text: str
    start_char: int
    end_char: int
    char_length: int
    token_estimate: int


class DocumentMetadata(BaseModel):
    id: str
    filename: str
    char_count: int
    chunk_count: int
    created_at: str
    content_preview: str


class RetrievedChunk(BaseModel):
    chunk: Chunk
    similarity_score: float
    rank: int


class RetrievalRequest(BaseModel):
    query: str
    top_k: Optional[int] = 4
    similarity_threshold: Optional[float] = 0.0


class RetrievalResponse(BaseModel):
    query: str
    results: List[RetrievedChunk]
    latency_ms: float


class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 4
    similarity_threshold: Optional[float] = 0.0
    compare_without_rag: Optional[bool] = False


class QueryResponse(BaseModel):
    query: str
    answer: str
    answer_without_rag: Optional[str] = None
    retrieved_chunks: List[RetrievedChunk]
    augmented_prompt: str
    latency_ms: float
    embedding_provider: str
    llm_provider: str
    llm_model: str


class SettingsUpdateRequest(BaseModel):
    chunk_size: Optional[int] = Field(None, ge=50, le=4000)
    chunk_overlap: Optional[int] = Field(None, ge=0, le=2000)
    top_k: Optional[int] = Field(None, ge=1, le=20)
    similarity_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    embedding_provider: Optional[str] = None  # "local", "gemini", "openai"
    llm_provider: Optional[str] = None        # "local", "gemini", "openai"
    llm_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None


class SystemSettings(BaseModel):
    chunk_size: int
    chunk_overlap: int
    top_k: int
    similarity_threshold: float
    embedding_provider: str
    llm_provider: str
    llm_model: str
    has_gemini_key: bool
    has_openai_key: bool
    available_embedding_providers: List[str]
    available_llm_providers: List[str]
    vector_count: int
    document_count: int

