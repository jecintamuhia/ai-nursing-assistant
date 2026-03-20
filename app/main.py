"""
app/main.py
FastAPI application factory.

Architecture:
  app/
  ├── main.py               ← app factory, lifespan, route registration
  ├── core/config.py        ← all settings (env vars)
  ├── models/schemas.py     ← Pydantic request/response models
  ├── services/
  │   ├── rag_service.py    ← PDF ingestion + conversational RAG
  │   ├── quiz_service.py   ← quiz generation + grading
  │   └── document_service.py ← file I/O helpers
  └── api/
      ├── deps.py           ← dependency injection
      └── routes/
          ├── documents.py  ← /api/documents/*
          ├── chat.py       ← /api/chat/*
          └── quiz.py       ← /api/quiz/*
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.deps import init_services, get_rag, get_quiz
from app.api.routes import documents, chat, quiz
from app.services.document_service import list_pdfs


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise singleton services."""
    init_services()
    print("✓ Services ready")
    yield
    print("✓ Shutdown complete")


app = FastAPI(
    title="AI Nursing Knowledge Assistant",
    description=(
        "RAG-powered Q&A system grounded in your nursing documents. "
        "Upload PDFs → ask questions → get cited answers → generate quizzes."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # tighten to your domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(quiz.router)

# ── Status endpoint ───────────────────────────────────────────────────────────
@app.get("/api/status", tags=["Health"])
def status():
    rag  = get_rag()
    quiz_svc = get_quiz()
    pdfs = list_pdfs()
    return {
        "pipeline_ready": rag.is_ready if rag else False,
        "quiz_ready":     quiz_svc.is_ready if quiz_svc else False,
        "uploaded_pdfs":  pdfs,
        "pdf_count":      len(pdfs),
    }

# ── Static frontend ───────────────────────────────────────────────────────────
STATIC = Path("static")
if STATIC.exists():
    app.mount("/static", StaticFiles(directory="static"), name="static")

    @app.get("/", include_in_schema=False)
    def serve_frontend():
        return FileResponse("static/index.html")
else:
    @app.get("/", tags=["Health"])
    def root():
        return {
            "service": "AI Nursing Knowledge Assistant v3",
            "docs": "/docs",
            "status": "/api/status",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)