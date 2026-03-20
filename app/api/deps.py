"""
app/api/deps.py
FastAPI dependency injection.
Services are instantiated once at startup and injected into routes.
"""

from app.services.rag_service import RAGService
from app.services.quiz_service import QuizService

# Module-level singletons (created once when the app starts)
_rag_service: RAGService | None = None
_quiz_service: QuizService | None = None


def init_services() -> None:
    """Call once during app startup."""
    global _rag_service, _quiz_service
    _rag_service  = RAGService()
    _quiz_service = QuizService()


def get_rag() -> RAGService:
    return _rag_service


def get_quiz() -> QuizService:
    return _quiz_service