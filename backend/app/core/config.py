from pathlib import Path
from pydantic_settings import BaseSettings

# backend/ directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    openai_api_key: str
    data_dir:        Path  = BACKEND_DIR / "data"
    embeddings_dir:  Path  = BACKEND_DIR / "embeddings"
    chunk_size:      int   = 800
    chunk_overlap:   int   = 150
    retriever_k:     int   = 5
    llm_model:       str   = "gpt-3.5-turbo"
    llm_temperature: float = 0.2
    memory_window:   int   = 6
    quiz_model:       str   = "gpt-3.5-turbo-16k"
    quiz_temperature: float = 0.4
    quiz_retriever_k: int   = 8

    class Config:
        # Try .env in backend/ first, then project root
        env_file = [
            str(BACKEND_DIR / ".env"),
            str(BACKEND_DIR.parent / ".env"),
        ]
        env_file_encoding = "utf-8-sig"

settings = Settings()