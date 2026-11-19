import uuid
from typing import List
from .models import Chunk


class NaiveChunker:
    """
    Fixed-size sliding-window chunker as defined in the canonical Naive RAG paradigm.
    Splits text by chunk_size with chunk_overlap.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        if chunk_overlap >= chunk_size:
            chunk_overlap = max(0, chunk_size - 50)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(self, doc_id: str, filename: str, text: str) -> List[Chunk]:
        """
        Splits raw text into overlapping character-level windows.
        Also attempts to snap chunk boundaries to nearby whitespace/newlines
        to prevent breaking words when possible while strictly respecting bounds.
        """
        text_length = len(text)
        if text_length == 0:
            return []

        chunks: List[Chunk] = []
        step = self.chunk_size - self.chunk_overlap
        if step <= 0:
            step = max(1, self.chunk_size // 2)

        start = 0
        chunk_idx = 0

        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            
            # If not at the very end of text, try to snap to nearest whitespace to keep words intact
            if end < text_length:
                # Look back up to 20% of chunk_size for a sentence or word break
                lookback_limit = max(start, end - min(60, self.chunk_size // 4))
                best_cut = -1
                for punct in ["\n\n", ".\n", ". ", "? ", "! ", "\n", " "]:
                    idx = text.rfind(punct, lookback_limit, end)
                    if idx != -1:
                        best_cut = idx + len(punct)
                        break
                if best_cut != -1 and best_cut > start:
                    end = best_cut

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunk_id = f"{doc_id}_c{chunk_idx}"
                # Rough token estimate (~4 chars per token in English)
                token_estimate = max(1, len(chunk_text) // 4)
                
                chunks.append(
                    Chunk(
                        id=chunk_id,
                        doc_id=doc_id,
                        filename=filename,
                        chunk_index=chunk_idx,
                        text=chunk_text,
                        start_char=start,
                        end_char=end,
                        char_length=len(chunk_text),
                        token_estimate=token_estimate,
                    )
                )
                chunk_idx += 1

            if end >= text_length:
                break

            # Calculate next start point taking overlap into account
            next_start = end - self.chunk_overlap
            if next_start <= start:
                next_start = start + step
            start = next_start

        return chunks

