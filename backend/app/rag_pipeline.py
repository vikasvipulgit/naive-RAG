import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

from .config import settings
from .models import (
    Chunk,
    DocumentMetadata,
    RetrievedChunk,
    QueryResponse,
    SystemSettings,
    SettingsUpdateRequest,
)
from .chunker import NaiveChunker
from .embeddings import (
    BaseEmbeddingProvider,
    get_embedding_provider,
)
from .vector_store import SimpleVectorStore
from .generator import LLMGenerator


class RAGPipeline:
    """
    Central Orchestrator for Naive RAG:
    1. Document Ingestion
    2. Fixed-Window Sliding Chunking
    3. Dense Vector Embeddings
    4. Cosine Similarity Vector Store
    5. Prompt Augmentation & LLM Generation
    """

    def __init__(self):
        # Hyperparameters
        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP
        self.top_k = settings.TOP_K
        self.similarity_threshold = settings.SIMILARITY_THRESHOLD
        self.embedding_provider_name = settings.EMBEDDING_PROVIDER
        self.llm_provider_name = settings.LLM_PROVIDER
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL
        self.openai_model = settings.OPENAI_MODEL

        # Pipeline components
        self.chunker = NaiveChunker(chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        self.embedding_provider = self._init_embedding_provider()
        self.vector_store = SimpleVectorStore()
        self.generator = self._init_generator()

        # In-memory document storage: doc_id -> doc_data
        self.documents: Dict[str, Dict[str, Any]] = {}

    def _init_embedding_provider(self) -> BaseEmbeddingProvider:
        key = self.gemini_api_key if self.embedding_provider_name == "gemini" else self.openai_api_key
        return get_embedding_provider(self.embedding_provider_name, api_key=key)

    def _init_generator(self) -> LLMGenerator:
        if self.llm_provider_name == "gemini":
            return LLMGenerator(provider="gemini", api_key=self.gemini_api_key, model=self.gemini_model)
        elif self.llm_provider_name == "openai":
            return LLMGenerator(provider="openai", api_key=self.openai_api_key, model=self.openai_model)
        else:
            return LLMGenerator(provider="local")

    def add_document(self, filename: str, text: str) -> DocumentMetadata:
        doc_id = str(uuid.uuid4())[:8]
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Chunk document
        chunks = self.chunker.chunk_document(doc_id=doc_id, filename=filename, text=text)

        # Generate embeddings
        chunk_texts = [c.text for c in chunks]
        if chunk_texts:
            embeddings = self.embedding_provider.embed_batch(chunk_texts)
            self.vector_store.add_chunks_with_embeddings(chunks, embeddings)

        self.documents[doc_id] = {
            "id": doc_id,
            "filename": filename,
            "text": text,
            "char_count": len(text),
            "chunk_count": len(chunks),
            "created_at": created_at,
        }

        return DocumentMetadata(
            id=doc_id,
            filename=filename,
            char_count=len(text),
            chunk_count=len(chunks),
            created_at=created_at,
            content_preview=text[:200] + ("..." if len(text) > 200 else ""),
        )

    def reindex_all(self):
        """Re-chunks and re-embeds all loaded documents with current settings."""
        self.vector_store.clear()
        self.chunker = NaiveChunker(chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        self.embedding_provider = self._init_embedding_provider()

        for doc_id, doc in self.documents.items():
            chunks = self.chunker.chunk_document(doc_id=doc_id, filename=doc["filename"], text=doc["text"])
            doc["chunk_count"] = len(chunks)
            chunk_texts = [c.text for c in chunks]
            if chunk_texts:
                embeddings = self.embedding_provider.embed_batch(chunk_texts)
                self.vector_store.add_chunks_with_embeddings(chunks, embeddings)

    def delete_document(self, doc_id: str):
        if doc_id in self.documents:
            del self.documents[doc_id]
            self.vector_store.delete_document_chunks(doc_id)

    def get_documents(self) -> List[DocumentMetadata]:
        result = []
        for doc_id, doc in self.documents.items():
            text = doc["text"]
            result.append(
                DocumentMetadata(
                    id=doc_id,
                    filename=doc["filename"],
                    char_count=doc["char_count"],
                    chunk_count=doc["chunk_count"],
                    created_at=doc["created_at"],
                    content_preview=text[:200] + ("..." if len(text) > 200 else ""),
                )
            )
        return result

    def get_chunks(self) -> List[Chunk]:
        return self.vector_store.get_all_chunks()

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None,
    ) -> Tuple[List[RetrievedChunk], float]:
        start_t = time.perf_counter()
        k = top_k if top_k is not None else self.top_k
        thresh = similarity_threshold if similarity_threshold is not None else self.similarity_threshold

        query_vec = self.embedding_provider.embed_text(query)
        results = self.vector_store.search(
            query_embedding=query_vec,
            top_k=k,
            similarity_threshold=thresh,
        )
        latency = (time.perf_counter() - start_t) * 1000.0
        return results, round(latency, 2)

    def answer_query(
        self,
        query: str,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None,
        compare_without_rag: bool = False,
    ) -> QueryResponse:
        start_t = time.perf_counter()

        retrieved_chunks, _ = self.retrieve(query, top_k, similarity_threshold)

        # Generate RAG answer
        answer, prompt_used = self.generator.generate_rag_answer(query, retrieved_chunks)

        answer_without_rag = None
        if compare_without_rag:
            answer_without_rag = self.generator.generate_direct_answer(query)

        latency = (time.perf_counter() - start_t) * 1000.0

        model_name = (
            self.gemini_model if self.llm_provider_name == "gemini"
            else self.openai_model if self.llm_provider_name == "openai"
            else "Local Extractive Synthesizer"
        )

        return QueryResponse(
            query=query,
            answer=answer,
            answer_without_rag=answer_without_rag,
            retrieved_chunks=retrieved_chunks,
            augmented_prompt=prompt_used,
            latency_ms=round(latency, 2),
            embedding_provider=self.embedding_provider.name,
            llm_provider=self.llm_provider_name,
            llm_model=model_name,
        )

    def update_settings(self, req: SettingsUpdateRequest):
        reindex_needed = False

        if req.chunk_size is not None and req.chunk_size != self.chunk_size:
            self.chunk_size = req.chunk_size
            reindex_needed = True

        if req.chunk_overlap is not None and req.chunk_overlap != self.chunk_overlap:
            self.chunk_overlap = req.chunk_overlap
            reindex_needed = True

        if req.top_k is not None:
            self.top_k = req.top_k

        if req.similarity_threshold is not None:
            self.similarity_threshold = req.similarity_threshold

        if req.gemini_api_key is not None:
            self.gemini_api_key = req.gemini_api_key

        if req.openai_api_key is not None:
            self.openai_api_key = req.openai_api_key

        if req.embedding_provider is not None and req.embedding_provider != self.embedding_provider_name:
            self.embedding_provider_name = req.embedding_provider
            reindex_needed = True

        if req.llm_provider is not None:
            self.llm_provider_name = req.llm_provider

        if req.llm_model is not None:
            if self.llm_provider_name == "gemini":
                self.gemini_model = req.llm_model
            elif self.llm_provider_name == "openai":
                self.openai_model = req.llm_model

        # Refresh generator and embedding provider
        self.embedding_provider = self._init_embedding_provider()
        self.generator = self._init_generator()

        if reindex_needed:
            self.reindex_all()

    def get_settings(self) -> SystemSettings:
        current_model = (
            self.gemini_model if self.llm_provider_name == "gemini"
            else self.openai_model if self.llm_provider_name == "openai"
            else "local-extractive"
        )
        return SystemSettings(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            top_k=self.top_k,
            similarity_threshold=self.similarity_threshold,
            embedding_provider=self.embedding_provider_name,
            llm_provider=self.llm_provider_name,
            llm_model=current_model,
            has_gemini_key=bool(self.gemini_api_key),
            has_openai_key=bool(self.openai_api_key),
            available_embedding_providers=["local", "gemini", "openai"],
            available_llm_providers=["local", "gemini", "openai"],
            vector_count=self.vector_store.total_chunks,
            document_count=len(self.documents),
        )

    def reset(self):
        self.documents.clear()
        self.vector_store.clear()


pipeline = RAGPipeline()

