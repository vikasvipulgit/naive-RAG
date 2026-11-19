import re
from typing import List, Optional, Tuple
from .models import RetrievedChunk


NAIVE_RAG_SYSTEM_PROMPT = """You are a helpful and precise AI knowledge assistant.
Your task is to answer the user's question using ONLY the retrieved reference context below.

CRITICAL INSTRUCTIONS:
1. Base your answer STRICTLY on the information provided in the Reference Context.
2. If the context does not contain the answer, you MUST state clearly:
   "Based on the provided documents, I could not find information to answer this question."
3. Do NOT make up facts or extrapolate beyond what is explicitly stated in the context.
4. When stating facts, cite the source filename or chunk number if relevant (e.g., [Source: doc.txt, Chunk 1]).
"""

NAIVE_RAG_USER_TEMPLATE = """Reference Context:
{context_block}

User Question: {query}

Provide a concise, accurate answer based strictly on the context above:"""

DIRECT_USER_TEMPLATE = """User Question: {query}

Provide a direct answer to the user's question:"""


def build_context_block(retrieved_chunks: List[RetrievedChunk]) -> str:
    if not retrieved_chunks:
        return "[No relevant chunks retrieved from the knowledge base]"

    blocks = []
    for r in retrieved_chunks:
        c = r.chunk
        blocks.append(
            f"--- [Chunk {c.chunk_index + 1} | Source: {c.filename} | Relevance: {r.similarity_score:.2f}] ---\n"
            f"{c.text}\n"
        )
    return "\n".join(blocks)


def build_augmented_prompt(query: str, retrieved_chunks: List[RetrievedChunk]) -> str:
    context_block = build_context_block(retrieved_chunks)
    return f"{NAIVE_RAG_SYSTEM_PROMPT}\n\n{NAIVE_RAG_USER_TEMPLATE.format(context_block=context_block, query=query)}"


class LocalOfflineSynthesizer:
    """
    Extractive synthesis engine for offline/free usage without external API keys.
    Extracts relevant sentences from retrieved chunks and summarizes them.
    """

    @staticmethod
    def generate(query: str, retrieved_chunks: List[RetrievedChunk]) -> str:
        if not retrieved_chunks or (retrieved_chunks and retrieved_chunks[0].similarity_score < 0.05):
            return "Based on the provided documents, I could not find information to answer this question."

        # Extract words from query
        query_words = set(re.findall(r"\w+", query.lower()))
        # Filter out stopwords
        stopwords = {"what", "is", "the", "in", "of", "and", "a", "an", "to", "how", "does", "do", "for", "are", "why", "who", "which"}
        key_words = query_words - stopwords
        if not key_words:
            key_words = query_words

        best_sentences = []
        for r in retrieved_chunks:
            chunk = r.chunk
            # Split into sentences
            sentences = re.split(r"(?<=[.!?])\s+", chunk.text)
            for s in sentences:
                s_clean = s.strip()
                if len(s_clean) < 15:
                    continue
                s_words = set(re.findall(r"\w+", s_clean.lower()))
                overlap = len(key_words.intersection(s_words))
                if overlap > 0:
                    best_sentences.append((overlap, r.similarity_score, s_clean, chunk.filename, chunk.chunk_index))

        if not best_sentences:
            # Fallback to the top chunk's first sentences
            top_chunk = retrieved_chunks[0].chunk
            summary = " ".join(top_chunk.text.split("\n")[:3])
            return f"{summary}\n\n*(Source: {top_chunk.filename}, Chunk #{top_chunk.chunk_index + 1})*"

        # Sort by keyword overlap and similarity score
        best_sentences.sort(key=lambda x: (x[0], x[1]), reverse=True)
        selected = best_sentences[:3]
        
        answer_parts = []
        sources = set()
        for _, _, sentence, fname, c_idx in selected:
            if sentence not in answer_parts:
                answer_parts.append(sentence)
                sources.add(f"{fname} (Chunk #{c_idx + 1})")

        answer_text = " ".join(answer_parts)
        sources_str = ", ".join(sources)
        return f"{answer_text}\n\n*(Extracted from sources: {sources_str})*"


class LLMGenerator:
    """Unified generator supporting Gemini, OpenAI, and Local synthesis."""

    def __init__(self, provider: str = "local", api_key: str = "", model: str = ""):
        self.provider = provider.lower()
        self.api_key = api_key
        self.model = model

    def generate_rag_answer(self, query: str, retrieved_chunks: List[RetrievedChunk]) -> Tuple[str, str]:
        """
        Returns (answer, full_augmented_prompt).
        """
        prompt = build_augmented_prompt(query, retrieved_chunks)

        if self.provider == "gemini" and self.api_key:
            try:
                from google import genai
                client = genai.Client(api_key=self.api_key)
                model_name = self.model or "gemini-2.5-flash"
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                return response.text or "No response generated.", prompt
            except Exception as e:
                # Fallback to local
                answer = f"[Gemini Error: {e}]\n\nFallback Answer:\n" + LocalOfflineSynthesizer.generate(query, retrieved_chunks)
                return answer, prompt

        elif self.provider == "openai" and self.api_key:
            try:
                import openai
                client = openai.OpenAI(api_key=self.api_key)
                model_name = self.model or "gpt-4o-mini"
                context_block = build_context_block(retrieved_chunks)
                user_content = NAIVE_RAG_USER_TEMPLATE.format(context_block=context_block, query=query)
                
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": NAIVE_RAG_SYSTEM_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    temperature=0.2,
                )
                return response.choices[0].message.content or "No response generated.", prompt
            except Exception as e:
                answer = f"[OpenAI Error: {e}]\n\nFallback Answer:\n" + LocalOfflineSynthesizer.generate(query, retrieved_chunks)
                return answer, prompt

        else:
            # Local offline synthesizer
            answer = LocalOfflineSynthesizer.generate(query, retrieved_chunks)
            return answer, prompt

    def generate_direct_answer(self, query: str) -> str:
        """Generates answer without any retrieved context (for hallucination comparison)."""
        if self.provider == "gemini" and self.api_key:
            try:
                from google import genai
                client = genai.Client(api_key=self.api_key)
                model_name = self.model or "gemini-2.5-flash"
                response = client.models.generate_content(
                    model=model_name,
                    contents=DIRECT_USER_TEMPLATE.format(query=query),
                )
                return response.text or "No response generated."
            except Exception as e:
                return f"[Gemini Direct Error: {e}]"
        elif self.provider == "openai" and self.api_key:
            try:
                import openai
                client = openai.OpenAI(api_key=self.api_key)
                model_name = self.model or "gpt-4o-mini"
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "user", "content": DIRECT_USER_TEMPLATE.format(query=query)},
                    ],
                    temperature=0.7,
                )
                return response.choices[0].message.content or "No response generated."
            except Exception as e:
                return f"[OpenAI Direct Error: {e}]"
        else:
            return "Without external context and LLM API keys, this question relies solely on the internal knowledge base indexing."

