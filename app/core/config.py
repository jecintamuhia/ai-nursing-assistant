"""
app/core/config.py
All runtime configuration in one place.
Reads from environment variables / .env file.
"""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── OpenAI ──────────────────────────────────────────────────────────────
    openai_api_key: str

    # ── Paths ────────────────────────────────────────────────────────────────
    data_dir: Path = Path("data")
    embeddings_dir: Path = Path("embeddings")

    # ── RAG pipeline ─────────────────────────────────────────────────────────
    chunk_size: int = 800
    chunk_overlap: int = 150
    retriever_k: int = 5          # top-k chunks to retrieve per query

    # ── LLM ──────────────────────────────────────────────────────────────────
    llm_model: str = "gpt-3.5-turbo"
    llm_temperature: float = 0.2
    memory_window: int = 6        # conversation turns to remember

    # ── Quiz ─────────────────────────────────────────────────────────────────
    quiz_model: str = "gpt-3.5-turbo-16k"
    quiz_temperature: float = 0.4
    quiz_retriever_k: int = 8

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()