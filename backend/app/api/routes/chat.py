from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import AskRequest, AskResponse
from app.api.deps import get_rag

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("/ask", response_model=AskResponse)
def ask(request: AskRequest, rag=Depends(get_rag)):
    if not request.question.strip():
        raise HTTPException(400, "Question cannot be empty.")
    result = rag.query(request.question)
    return AskResponse(**result)

@router.delete("/memory")
def clear_memory(rag=Depends(get_rag)):
    rag.clear_memory()
    return {"message": "Conversation memory cleared."}