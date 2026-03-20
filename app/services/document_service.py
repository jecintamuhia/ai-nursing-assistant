"""
app/services/document_service.py
Handles all file I/O: saving uploads, listing PDFs, formatting citations.
Keeps file logic separate from the RAG pipeline.
"""

import hashlib
from pathlib import Path
from typing import List

from app.core.config import settings


def ensure_dirs() -> None:
    settings.data_dir.mkdir(exist_ok=True)
    settings.embeddings_dir.mkdir(exist_ok=True)


def save_upload(file_bytes: bytes, filename: str) -> str:
    """Persist uploaded bytes to data/ and return the full path string."""
    ensure_dirs()
    safe_name = Path(filename).name          # strip path traversal
    dest = settings.data_dir / safe_name
    dest.write_bytes(file_bytes)
    return str(dest)


def list_pdfs() -> List[str]:
    """Return sorted list of PDF filenames in data/."""
    ensure_dirs()
    return sorted(f.name for f in settings.data_dir.glob("*.pdf"))


def get_file_hash(filepath: str) -> str:
    """MD5 hash of a file — useful for cache invalidation."""
    h = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def format_citations(source_documents) -> List[dict]:
    """
    Convert LangChain Document objects → clean citation dicts.
    Deduplicates by (source, page) so the same page isn't cited twice.
    """
    citations, seen = [], set()
    for doc in source_documents:
        meta    = doc.metadata or {}
        page    = meta.get("page", "?")
        source  = Path(meta.get("source", "unknown")).name
        snippet = doc.page_content[:300].replace("\n", " ").strip()
        key     = (source, page)
        if key not in seen:
            seen.add(key)
            citations.append({"source": source, "page": page, "snippet": snippet})
    return citations