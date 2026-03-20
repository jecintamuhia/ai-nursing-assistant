"""
rag_pipeline.py — RAG (Retrieval-Augmented Generation) Pipeline
Handles: PDF loading → chunking → embeddings → FAISS vector store → QA chain
"""

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

load_dotenv()

# ── Paths ──────────────────────────────────────────────────────────────────────
DATA_DIR       = Path("data")
EMBEDDINGS_DIR = Path("embeddings")
FAISS_INDEX    = EMBEDDINGS_DIR / "faiss_index"

# ── Chunking config ────────────────────────────────────────────────────────────
CHUNK_SIZE    = 800   # characters per chunk
CHUNK_OVERLAP = 150   # overlap to preserve context across chunks

# ── LLM config ────────────────────────────────────────────────────────────────
LLM_MODEL       = "gpt-3.5-turbo"
LLM_TEMPERATURE = 0.2        # low = more factual
MEMORY_WINDOW   = 6          # remember last 6 exchanges

SYSTEM_PROMPT = """You are an expert nursing knowledge assistant.
Answer questions STRICTLY based on the provided nursing documents.
Always cite the document name and page number for every claim.
If the answer is not found in the documents, say clearly:
"I could not find this information in the uploaded documents."
Do NOT use outside knowledge or make assumptions.
Be concise, clinically accurate, and professional."""


class NursingRAGPipeline:
    """
    Manages the full RAG lifecycle:
      1. Ingest PDFs  →  chunk  →  embed  →  FAISS
      2. Answer questions with source citations and memory
    """

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "OPENAI_API_KEY not set. Create a .env file from .env.example."
            )

        self.embeddings = OpenAIEmbeddings(openai_api_key=api_key)
        self.llm = ChatOpenAI(
            model_name=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            openai_api_key=api_key,
        )
        self.vectorstore: Optional[FAISS] = None
        self.qa_chain = None
        self.memory = ConversationBufferWindowMemory(
            k=MEMORY_WINDOW,
            memory_key="chat_history",
            return_messages=True,
            output_key="answer",
        )

        # Auto-load an existing index if present
        if FAISS_INDEX.exists():
            self._load_index()

    # ── Ingestion ──────────────────────────────────────────────────────────────

    def ingest_pdfs(self) -> dict:
        """
        Load all PDFs in data/, split into chunks, embed, save FAISS index.
        Returns a summary dict.
        """
        pdf_files = list(DATA_DIR.glob("*.pdf"))
        if not pdf_files:
            return {"status": "no_pdfs", "files": [], "chunks": 0}

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

        all_docs = []
        loaded_files = []

        for pdf_path in pdf_files:
            try:
                loader = PyPDFLoader(str(pdf_path))
                pages  = loader.load()
                chunks = splitter.split_documents(pages)
                all_docs.extend(chunks)
                loaded_files.append(pdf_path.name)
                print(f"  ✓ {pdf_path.name}  ({len(chunks)} chunks)")
            except Exception as e:
                print(f"  ✗ {pdf_path.name}: {e}")

        if not all_docs:
            return {"status": "error", "message": "No documents could be loaded."}

        # Build / rebuild FAISS index
        self.vectorstore = FAISS.from_documents(all_docs, self.embeddings)
        EMBEDDINGS_DIR.mkdir(exist_ok=True)
        self.vectorstore.save_local(str(FAISS_INDEX))

        self._build_chain()

        return {
            "status":  "success",
            "files":   loaded_files,
            "chunks":  len(all_docs),
        }

    def _load_index(self):
        """Load a previously saved FAISS index from disk."""
        try:
            self.vectorstore = FAISS.load_local(
                str(FAISS_INDEX),
                self.embeddings,
                allow_dangerous_deserialization=True,
            )
            self._build_chain()
            print("✓ Loaded existing FAISS index.")
        except Exception as e:
            print(f"⚠ Could not load FAISS index: {e}")

    # ── QA Chain ───────────────────────────────────────────────────────────────

    def _build_chain(self):
        """Wire up the ConversationalRetrievalChain."""
        if not self.vectorstore:
            return

        retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5},       # fetch top-5 most relevant chunks
        )

        self.qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=retriever,
            memory=self.memory,
            return_source_documents=True,
            output_key="answer",
            verbose=False,
            combine_docs_chain_kwargs={
                "prompt": self._build_prompt()
            },
        )

    def _build_prompt(self):
        """Create a PromptTemplate that injects the system instructions."""
        from langchain.prompts import PromptTemplate

        template = f"""{SYSTEM_PROMPT}

Context from documents:
{{context}}

Conversation so far:
{{chat_history}}

Question: {{question}}

Answer (with citations):"""

        return PromptTemplate(
            input_variables=["context", "chat_history", "question"],
            template=template,
        )

    # ── Query ──────────────────────────────────────────────────────────────────

    def query(self, question: str) -> dict:
        """
        Answer a question using the RAG pipeline.
        Returns: answer (str), sources (list[dict]), chat_history length (int)
        """
        if not self.qa_chain:
            return {
                "answer":  "No documents have been ingested yet. Please upload PDFs first.",
                "sources": [],
                "history_length": 0,
            }

        result = self.qa_chain.invoke({"question": question})

        from app.utils import format_sources
        sources = format_sources(result.get("source_documents", []))

        return {
            "answer":         result["answer"],
            "sources":        sources,
            "history_length": len(self.memory.chat_memory.messages) // 2,
        }

    def clear_memory(self):
        """Reset conversation history."""
        self.memory.clear()

    @property
    def is_ready(self) -> bool:
        return self.qa_chain is not None