import abc
import hashlib
import re
from typing import List
import numpy as np


class BaseEmbeddingProvider(abc.ABC):
    @property
    @abc.abstractmethod
    def name(self) -> str:
        pass

    @property
    @abc.abstractmethod
    def dimension(self) -> int:
        pass

    @abc.abstractmethod
    def embed_text(self, text: str) -> np.ndarray:
        """Returns a 1D normalized numpy array."""
        pass

    def embed_batch(self, texts: List[str]) -> np.ndarray:
        """Returns a 2D numpy array [N, dimension]. Default loops over embed_text."""
        return np.array([self.embed_text(t) for t in texts], dtype=np.float32)


class LocalTfIdfDenseEmbeddingProvider(BaseEmbeddingProvider):
    """
    Fast, deterministic offline embedding provider using subword n-gram hashing
    and normalized dense random projection (Johnson-Lindenstrauss lemma).
    Requires zero external API keys and runs instantly on any machine.
    """

    def __init__(self, dim: int = 384, hash_space: int = 4096):
        self._dim = dim
        self._hash_space = hash_space
        # Seeded deterministic random projection matrix
        rng = np.random.RandomState(42)
        # Sparse or Gaussian projection matrix (hash_space -> dim)
        self._projection = rng.normal(0, 1.0 / np.sqrt(self._dim), (self._hash_space, self._dim)).astype(np.float32)

    @property
    def name(self) -> str:
        return "Local Dense Hash Vectorizer (Offline)"

    @property
    def dimension(self) -> int:
        return self._dim

    def _extract_ngrams(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        words = [w for w in cleaned.split() if len(w) > 1]
        features = list(words)
        # Add character 3-grams and 4-grams for subword matching
        for word in words:
            if len(word) >= 3:
                for k in range(len(word) - 2):
                    features.append(word[k : k + 3])
            if len(word) >= 4:
                for k in range(len(word) - 3):
                    features.append(word[k : k + 4])
        return features

    def embed_text(self, text: str) -> np.ndarray:
        if not text.strip():
            vec = np.zeros(self._dim, dtype=np.float32)
            vec[0] = 1.0
            return vec

        ngrams = self._extract_ngrams(text)
        if not ngrams:
            vec = np.zeros(self._dim, dtype=np.float32)
            vec[0] = 1.0
            return vec

        # Sparse hash vector
        sparse_vec = np.zeros(self._hash_space, dtype=np.float32)
        for token in ngrams:
            # Deterministic hash to bucket
            h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16) % self._hash_space
            # Hash sign for reduced collision distortion
            h_sign = 1.0 if (int(hashlib.sha256(token.encode("utf-8")).hexdigest(), 16) % 2 == 0) else -1.0
            sparse_vec[h] += h_sign

        # Apply log-scaling (TF)
        sparse_vec = np.sign(sparse_vec) * np.log1p(np.abs(sparse_vec))

        # Project to dense space
        dense_vec = np.dot(sparse_vec, self._projection)

        # L2 Normalize
        norm = np.linalg.norm(dense_vec)
        if norm > 1e-9:
            dense_vec = dense_vec / norm
        else:
            dense_vec[0] = 1.0

        return dense_vec.astype(np.float32)


class GeminiEmbeddingProvider(BaseEmbeddingProvider):
    """Embeddings using Google Gemini API."""

    def __init__(self, api_key: str, model: str = "text-embedding-004"):
        self.api_key = api_key
        self.model = model
        self._dim = 768
        self._client = None
        if api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=api_key)
            except Exception as e:
                print(f"Warning: Failed to initialize google-genai client: {e}")

    @property
    def name(self) -> str:
        return f"Gemini ({self.model})"

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_text(self, text: str) -> np.ndarray:
        if not self._client:
            raise ValueError("Gemini API key is missing or client failed to initialize.")
        try:
            response = self._client.models.embed_content(
                model=self.model,
                contents=text,
            )
            # Response may contain embeddings list or embedding
            embedding_vals = response.embedding.values
            vec = np.array(embedding_vals, dtype=np.float32)
            norm = np.linalg.norm(vec)
            if norm > 1e-9:
                vec = vec / norm
            return vec
        except Exception as e:
            raise RuntimeError(f"Gemini embedding error: {e}")


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    """Embeddings using OpenAI API."""

    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.api_key = api_key
        self.model = model
        self._dim = 1536
        self._client = None
        if api_key:
            try:
                import openai
                self._client = openai.OpenAI(api_key=api_key)
            except Exception as e:
                print(f"Warning: Failed to initialize openai client: {e}")

    @property
    def name(self) -> str:
        return f"OpenAI ({self.model})"

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_text(self, text: str) -> np.ndarray:
        if not self._client:
            raise ValueError("OpenAI API key is missing or client failed to initialize.")
        try:
            response = self._client.embeddings.create(
                input=text,
                model=self.model
            )
            vec = np.array(response.data[0].embedding, dtype=np.float32)
            norm = np.linalg.norm(vec)
            if norm > 1e-9:
                vec = vec / norm
            return vec
        except Exception as e:
            raise RuntimeError(f"OpenAI embedding error: {e}")


def get_embedding_provider(provider_type: str, api_key: str = "") -> BaseEmbeddingProvider:
    provider = provider_type.lower()
    if provider == "gemini" and api_key:
        return GeminiEmbeddingProvider(api_key=api_key)
    elif provider == "openai" and api_key:
        return OpenAIEmbeddingProvider(api_key=api_key)
    else:
        # Default fallback
        return LocalTfIdfDenseEmbeddingProvider()

