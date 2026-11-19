import io
import json
import csv
from typing import Tuple
from pypdf import PdfReader


class DocumentLoader:
    """Handles parsing and text extraction for various document formats."""

    @staticmethod
    def load_from_bytes(filename: str, content_bytes: bytes) -> str:
        ext = filename.lower().split(".")[-1]
        
        if ext == "pdf":
            return DocumentLoader._extract_pdf(content_bytes)
        elif ext in ["txt", "md", "markdown", "rst"]:
            return DocumentLoader._extract_text(content_bytes)
        elif ext == "json":
            return DocumentLoader._extract_json(content_bytes)
        elif ext == "csv":
            return DocumentLoader._extract_csv(content_bytes)
        else:
            # Fallback to UTF-8 text decode
            try:
                return content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                return content_bytes.decode("latin-1", errors="ignore")

    @staticmethod
    def _extract_pdf(content_bytes: bytes) -> str:
        reader = PdfReader(io.BytesIO(content_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_pages.append(f"--- Page {i + 1} ---\n{text.strip()}")
        return "\n\n".join(extracted_pages)

    @staticmethod
    def _extract_text(content_bytes: bytes) -> str:
        try:
            return content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return content_bytes.decode("latin-1", errors="ignore")

    @staticmethod
    def _extract_json(content_bytes: bytes) -> str:
        text = content_bytes.decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(text)
            return json.dumps(parsed, indent=2)
        except Exception:
            return text

    @staticmethod
    def _extract_csv(content_bytes: bytes) -> str:
        text = content_bytes.decode("utf-8", errors="ignore")
        reader = csv.reader(io.StringIO(text))
        rows = [" | ".join(row) for row in reader]
        return "\n".join(rows)

