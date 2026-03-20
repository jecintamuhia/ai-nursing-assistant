"""
tests/test_api.py
Basic smoke tests — run with: pytest tests/
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_redirects_or_responds():
    r = client.get("/")
    assert r.status_code in (200, 307)


def test_status_endpoint():
    r = client.get("/api/status")
    assert r.status_code == 200
    data = r.json()
    assert "pipeline_ready" in data
    assert "uploaded_pdfs" in data


def test_ask_without_docs_returns_graceful_message():
    r = client.post("/api/chat/ask", json={"question": "What is sepsis?"})
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body
    # Should not crash — just say no docs loaded
    assert len(body["answer"]) > 0


def test_quiz_without_docs_returns_400():
    r = client.post("/api/quiz/generate", json={
        "topic": "medication",
        "num_questions": 3,
        "difficulty": "intermediate",
        "question_type": "MCQ",
    })
    assert r.status_code == 400


def test_clear_memory():
    r = client.delete("/api/chat/memory")
    assert r.status_code == 200


def test_list_documents():
    r = client.get("/api/documents/")
    assert r.status_code == 200
    assert "pdfs" in r.json()