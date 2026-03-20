"""
app/services/quiz_service.py
Quiz generation & grading via RAG + LLM.

Flow:
  topic  →  FAISS similarity search  →  top-k chunks
         →  LLM (prompted to generate JSON questions)
         →  parse + return QuizResponse
"""

import json
import re
from pathlib import Path
from typing import Optional

from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.core.config import settings

FAISS_INDEX = settings.embeddings_dir / "faiss_index"

_GENERATE_TEMPLATE = """You are an expert nursing educator.
Using ONLY the content below, generate {n} {qtype} questions at {diff} difficulty.

Content:
{context}

Rules:
- Every question must come directly from the content above
- For MCQ: 4 options (A-D), mark correct answer, add explanation
- For True/False: correct_answer = "True" or "False", add explanation
- For Short Answer: correct_answer = 2-3 sentence model answer

Respond with ONLY valid JSON, no markdown fences:
{{
  "questions": [
    {{
      "id": 1,
      "type": "{qtype}",
      "difficulty": "{diff}",
      "question": "...",
      "options": {{"A":"...","B":"...","C":"...","D":"..."}},
      "correct_answer": "A",
      "explanation": "...",
      "source_hint": "short phrase from source"
    }}
  ]
}}
For True/False and Short Answer set options to null."""

_GRADE_TEMPLATE = """Grade this nursing exam short-answer response.

Question: {question}
Model answer: {model}
Student answer: {student}

Respond with ONLY valid JSON:
{{"score": 0-10, "feedback": "brief constructive comment", "key_points_missed": ["..."]}}"""


class QuizService:
    def __init__(self):
        self._embeddings = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
        self._llm = ChatOpenAI(
            model_name=settings.quiz_model,
            temperature=settings.quiz_temperature,
            openai_api_key=settings.openai_api_key,
        )
        self._vectorstore: Optional[FAISS] = None
        if FAISS_INDEX.exists():
            self.reload()

    @property
    def is_ready(self) -> bool:
        return self._vectorstore is not None

    def reload(self) -> None:
        try:
            self._vectorstore = FAISS.load_local(
                str(FAISS_INDEX), self._embeddings,
                allow_dangerous_deserialization=True,
            )
        except Exception as e:
            print(f"QuizService: index load failed: {e}")

    def generate(self, topic: str, num_questions: int,
                 difficulty: str, question_type: str) -> dict:
        if not self.is_ready:
            return {"error": "No documents ingested.", "questions": []}

        docs = self._vectorstore.similarity_search(
            topic, k=settings.quiz_retriever_k
        )
        if not docs:
            return {"error": f"No content found for '{topic}'.", "questions": []}

        context = "\n\n---\n\n".join(
            f"[{Path(d.metadata.get('source','?')).name} p.{d.metadata.get('page','?')}]\n{d.page_content}"
            for d in docs
        )

        prompt = _GENERATE_TEMPLATE.format(
            n=num_questions, qtype=question_type,
            diff=difficulty, context=context,
        )

        raw = self._llm.invoke(prompt).content.strip()
        raw = re.sub(r"^```json\s*|\s*```$", "", raw)

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {"error": "LLM returned invalid JSON.", "questions": []}

        return {
            "topic": topic,
            "difficulty": difficulty,
            "question_type": question_type,
            "total": len(parsed.get("questions", [])),
            "questions": parsed.get("questions", []),
        }

    def grade(self, question: dict, user_answer: str) -> dict:
        qtype   = question.get("type", "MCQ")
        correct = question.get("correct_answer", "")
        expl    = question.get("explanation", "")

        if qtype in ("MCQ", "True/False"):
            ok = user_answer.strip().upper() == correct.strip().upper()
            return {
                "correct": ok,
                "correct_answer": correct,
                "explanation": expl,
                "feedback": "Correct!" if ok else f"The answer is {correct}. {expl}",
            }

        # Short Answer → LLM grading
        prompt = _GRADE_TEMPLATE.format(
            question=question.get("question", ""),
            model=correct,
            student=user_answer,
        )
        raw = self._llm.invoke(prompt).content.strip()
        raw = re.sub(r"^```json\s*|\s*```$", "", raw)
        try:
            result = json.loads(raw)
            result["correct_answer"] = correct
            return result
        except Exception:
            return {
                "score": None,
                "feedback": "Auto-grading unavailable. Compare with model answer.",
                "correct_answer": correct,
            }