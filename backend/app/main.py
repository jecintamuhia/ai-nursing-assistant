from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.deps import init_services, get_rag, get_quiz
from app.api.routes import documents, chat, quiz
from app.services.document_service import list_pdfs

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_services()
    print("✓ Services ready")
    yield
    print("✓ Shutdown complete")

app = FastAPI(
    title="AI Nursing Knowledge Assistant",
    description="RAG-powered Q&A grounded in your nursing documents.",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(quiz.router)

@app.get("/api/status", tags=["Health"])
def status():
    rag      = get_rag()
    quiz_svc = get_quiz()
    pdfs     = list_pdfs()
    return {
        "pipeline_ready": rag.is_ready      if rag      else False,
        "quiz_ready":     quiz_svc.is_ready if quiz_svc else False,
        "uploaded_pdfs":  pdfs,
        "pdf_count":      len(pdfs),
    }

@app.get("/", tags=["Health"])
def root():
    return {"message": "API running", "docs": "/docs", "status": "/api/status"}