from app.services.rag_service import RAGService
from app.services.quiz_service import QuizService

_rag:  RAGService  | None = None
_quiz: QuizService | None = None

def init_services() -> None:
    global _rag, _quiz
    _rag  = RAGService()
    _quiz = QuizService()

def get_rag()  -> RAGService:  return _rag
def get_quiz() -> QuizService: return _quiz