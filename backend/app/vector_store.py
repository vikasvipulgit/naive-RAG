from typing import List, Optional, Tuple
import numpy as np
from .models import Chunk, RetrievedChunk


class SimpleVectorStore:
    """
    In-memory vector store implementing exact Cosine Similarity search
    for the Naive RAG pipeline.
    """

    def __init__(self):
        self._chunks: List[Chunk] = []
        self._embeddings: Optional[np.ndarray] = None  # Shape [N, D]

    @property
    def total_chunks(self) -> int:
        return len(self._chunks)

    def clear(self):
        self._chunks = []
        self._embeddings = None

    def add_chunks_with_embeddings(self, chunks: List[Chunk], embeddings: np.ndarray):
        """
        Appends chunks and their corresponding normalized vectors.
        embeddings must have shape [len(chunks), D].
        """
        if len(chunks) == 0:
            return

        if embeddings.shape[0] != len(chunks):
            raise ValueError(f"Number of chunks ({len(chunks)}) != number of vectors ({embeddings.shape[0]})")

        self._chunks.extend(chunks)

        if self._embeddings is None:
            self._embeddings = embeddings.astype(np.float32)
        else:
            # Check dimension match
            if self._embeddings.shape[1] != embeddings.shape[1]:
                # If dimension changed (e.g. provider switched), we re-assign
                self._embeddings = embeddings.astype(np.float32)
            else:
                self._embeddings = np.vstack([self._embeddings, embeddings.astype(np.float32)])

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 4,
        similarity_threshold: float = 0.0,
    ) -> List[RetrievedChunk]:
        """
        Executes Cosine Similarity search:
        sim(q, d) = q . d (assuming vectors are L2-normalized)
        """
        if self._embeddings is None or len(self._chunks) == 0:
            return []

        # Ensure query is 1D
        query_vec = query_embedding.flatten()

        # Compute dot product against all chunks
        # Shape: [N]
        scores = np.dot(self._embeddings, query_vec)

        # Clip scores to [-1.0, 1.0] to guard against tiny float precision quirks
        scores = np.clip(scores, -1.0, 1.0)

        # Sort indices in descending order
        ranked_indices = np.argsort(scores)[::-1]

        results: List[RetrievedChunk] = []
        rank = 1
        for idx in ranked_indices:
            score = float(scores[idx])
            if score < similarity_threshold:
                continue

            results.append(
                RetrievedChunk(
                    chunk=self._chunks[idx],
                    similarity_score=round(score, 4),
                    rank=rank,
                )
            )
            rank += 1
            if len(results) >= top_k:
                break

        return results

    def get_all_chunks(self) -> List[Chunk]:
        return list(self._chunks)

    def delete_document_chunks(self, doc_id: str):
        """Removes all chunks associated with doc_id."""
        if not self._chunks:
            return
        
        keep_indices = [i for i, c in enumerate(self._chunks) if c.doc_id != doc_id]
        if len(keep_indices) == len(self._chunks):
            return

        self._chunks = [self._chunks[i] for i in keep_indices]
        if self._embeddings is not None:
            if keep_indices:
                self._embeddings = self._embeddings[keep_indices]
            else:
                self._embeddings = None

