"""
app/models/schemas.py
All Pydantic request & response models.
Keeps API contracts explicit and self-documenting.
"""

from typing import Any, List, Optional
from pydantic import BaseModel, Field


# ── Documents ─────────────────────────────────────────────────────────────────

class IngestResponse(BaseModel):
    status: str
    files: List[str]
    chunks: int
    message: Optional[str] = None


class PDFListResponse(BaseModel):
    pdfs: List[str]
    count: int


# ── Q&A ───────────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)


class Citation(BaseModel):
    source: str
    page: int | str
    snippet: str


class AskResponse(BaseModel):
    answer: str
    sources: List[Citation]
    history_length: int


# ── Quiz ──────────────────────────────────────────────────────────────────────

class QuizRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    num_questions: int = Field(default=5, ge=1, le=15)
    difficulty: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced)$")
    question_type: str = Field(default="MCQ", pattern="^(MCQ|True/False|Short Answer)$")


class QuizQuestion(BaseModel):
    id: int
    type: str
    difficulty: str
    question: str
    options: Optional[dict] = None
    correct_answer: str
    explanation: str
    source_hint: Optional[str] = None


class QuizResponse(BaseModel):
    topic: str
    difficulty: str
    question_type: str
    total: int
    questions: List[QuizQuestion]


class GradeRequest(BaseModel):
    question: dict
    user_answer: str


class GradeResponse(BaseModel):
    correct: Optional[bool] = None
    score: Optional[int] = None
    correct_answer: str
    feedback: str
    key_points_missed: Optional[List[str]] = None


# ── Status ────────────────────────────────────────────────────────────────────

class StatusResponse(BaseModel):
    pipeline_ready: bool
    quiz_ready: bool
    uploaded_pdfs: List[str]
    pdf_count: int