"""
utils.py — Helper utilities for the AI Nursing Assistant
"""

import os
import hashlib
from pathlib import Path
from typing import List

DATA_DIR = Path("data")
EMBEDDINGS_DIR = Path("embeddings")


def ensure_dirs():
    """Make sure required directories exist."""
    DATA_DIR.mkdir(exist_ok=True)
    EMBEDDINGS_DIR.mkdir(exist_ok=True)


def get_pdf_hash(filepath: str) -> str:
    """Return an MD5 hash of a PDF file (used to detect changes)."""
    h = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def list_uploaded_pdfs() -> List[str]:
    """Return a list of PDF filenames in the data directory."""
    ensure_dirs()
    return [f.name for f in DATA_DIR.glob("*.pdf")]


def save_upload(file_bytes: bytes, filename: str) -> str:
    """Save uploaded bytes to data/ and return the full path."""
    ensure_dirs()
    safe_name = Path(filename).name          # strip any path traversal
    dest = DATA_DIR / safe_name
    dest.write_bytes(file_bytes)
    return str(dest)


def format_sources(source_documents) -> List[dict]:
    """
    Convert LangChain Document objects into a clean list of citation dicts.
    Each dict has: page, source (filename), snippet.
    """
    citations = []
    seen = set()
    for doc in source_documents:
        meta = doc.metadata or {}
        page = meta.get("page", "?")
        source = Path(meta.get("source", "unknown")).name
        snippet = doc.page_content[:300].replace("\n", " ").strip()
        key = (source, page)
        if key not in seen:
            seen.add(key)
            citations.append({"source": source, "page": page, "snippet": snippet})
    return citations