from pathlib import Path
from typing import List
from app.core.config import settings

def ensure_dirs() -> None:
    settings.data_dir.mkdir(exist_ok=True)
    settings.embeddings_dir.mkdir(exist_ok=True)

def save_upload(file_bytes: bytes, filename: str) -> str:
    ensure_dirs()
    safe_name = Path(filename).name
    dest = settings.data_dir / safe_name
    dest.write_bytes(file_bytes)
    return str(dest)

def list_pdfs() -> List[str]:
    ensure_dirs()
    return sorted(f.name for f in settings.data_dir.glob("*.pdf"))

def format_citations(source_documents) -> List[dict]:
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