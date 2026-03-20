# 🏥 AI Nursing Knowledge Assistant

> A production-grade RAG system that answers clinical questions **strictly from your uploaded nursing documents** — with source citations, conversation memory, and a quiz generator.

Built to demonstrate: **LLM integration · RAG architecture · vector databases · FastAPI · real-world AI pipelines**

---

## 🏗 Architecture

```
User  →  FastAPI REST API
            │
            ├── POST /api/documents/upload
            │       └── PyPDFLoader → RecursiveCharacterTextSplitter
            │                └── OpenAI Embeddings → FAISS (persisted)
            │
            ├── POST /api/chat/ask
            │       └── Query embedding → FAISS retrieval (top-5)
            │                └── GPT-3.5 + ConversationBufferWindowMemory
            │                        └── Grounded answer + citations
            │
            └── POST /api/quiz/generate
                    └── FAISS retrieval → GPT quiz generation
                            └── JSON questions (MCQ / T-F / Short Answer)
```

---

## 📁 Project Structure

```
nursing-ai/
├── app/
│   ├── main.py                    ← FastAPI factory, lifespan, routes
│   ├── core/
│   │   └── config.py              ← Centralised settings (pydantic-settings)
│   ├── models/
│   │   └── schemas.py             ← All Pydantic request/response models
│   ├── services/
│   │   ├── rag_service.py         ← PDF ingestion + conversational RAG
│   │   ├── quiz_service.py        ← Quiz generation + AI grading
│   │   └── document_service.py   ← File I/O, citations formatter
│   └── api/
│       ├── deps.py                ← Dependency injection
│       └── routes/
│           ├── documents.py       ← /api/documents/*
│           ├── chat.py            ← /api/chat/*
│           └── quiz.py            ← /api/quiz/*
├── static/
│   └── index.html                 ← Full web UI (Chat + Quiz + Architecture)
├── data/                          ← Drop PDFs here
├── embeddings/                    ← Auto-generated FAISS index
├── tests/
│   └── test_api.py                ← Smoke tests (pytest)
├── requirements.txt
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

```bash
# 1. Clone & create virtualenv
git clone <repo>
cd nursing-ai
python -m venv venv && source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure API key
cp .env.example .env
# Edit .env:  OPENAI_API_KEY=sk-...

# 4. Run
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000** → upload PDFs → ask questions.

Interactive API docs: **http://localhost:8000/docs**

---

## 🔌 API Reference

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/upload` | Upload PDF → auto-ingest |
| `POST` | `/api/documents/ingest` | Re-index all PDFs in `data/` |
| `GET`  | `/api/documents/` | List uploaded PDFs |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/ask` | Ask a question |
| `DELETE` | `/api/chat/memory` | Clear conversation history |

### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/quiz/generate` | Generate quiz from docs |
| `POST` | `/api/quiz/grade` | Grade a single answer |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/status` | System status + PDF count |

---

## 💬 Example: Ask a question

```bash
curl -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the correct dose of amoxicillin for a 10kg child?"}'
```

```json
{
  "answer": "According to the Paediatric Nursing Handbook (p.142), amoxicillin is dosed at 25–50 mg/kg/day divided every 8 hours.",
  "sources": [{"source": "paediatric_handbook.pdf", "page": 142, "snippet": "Amoxicillin 25-50mg/kg/day..."}],
  "history_length": 1
}
```

## 📝 Example: Generate a quiz

```bash
curl -X POST http://localhost:8000/api/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "fluid balance", "num_questions": 5, "difficulty": "intermediate", "question_type": "MCQ"}'
```

---

## ⚙️ Configuration (app/core/config.py)

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Required |
| `chunk_size` | `800` | Characters per text chunk |
| `chunk_overlap` | `150` | Overlap between chunks |
| `retriever_k` | `5` | Chunks retrieved per query |
| `llm_model` | `gpt-3.5-turbo` | Switch to `gpt-4` for accuracy |
| `llm_temperature` | `0.2` | Lower = more factual |
| `memory_window` | `6` | Conversation turns to remember |

---

## 🧪 Tests

```bash
pip install pytest httpx
pytest tests/ -v
```

---

## 🔒 Design Principles

- **Grounded only** — system prompt explicitly prohibits outside knowledge
- **Local vector store** — FAISS persisted to `embeddings/` (no cloud DB needed)
- **Dependency injection** — services are singletons wired via `app/api/deps.py`
- **Separated concerns** — routes, services, schemas, config all in distinct layers
- **Production-ready structure** — mirrors real FastAPI applications used in industry