"""
app/api/routes/chat.py
Conversational Q&A endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import AskRequest, AskResponse
from app.api.deps import get_rag

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/ask", response_model=AskResponse)
def ask(request: AskRequest, rag=Depends(get_rag)):
    """Ask a clinical question grounded in your uploaded documents."""
    result = rag.query(request.question)
    return AskResponse(**result)


@router.delete("/memory")
def clear_memory(rag=Depends(get_rag)):
    """Reset the conversation history."""
    rag.clear_memory()
    return {"message": "Conversation memory cleared."}