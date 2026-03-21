from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import GradeRequest, GradeResponse, QuizRequest, QuizResponse
from app.api.deps import get_quiz

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

@router.post("/generate", response_model=QuizResponse)
def generate(request: QuizRequest, quiz=Depends(get_quiz)):
    if not quiz.is_ready:
        raise HTTPException(400, "No documents ingested. Upload PDFs first.")
    result = quiz.generate(
        topic=request.topic,
        num_questions=request.num_questions,
        difficulty=request.difficulty,
        question_type=request.question_type,
    )
    if "error" in result and not result["questions"]:
        raise HTTPException(422, result["error"])
    return result

@router.post("/grade", response_model=GradeResponse)
def grade(request: GradeRequest, quiz=Depends(get_quiz)):
    return quiz.grade(request.question, request.user_answer)