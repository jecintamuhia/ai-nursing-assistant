from pathlib import Path
from typing import List, Optional
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings
from app.services.document_service import format_citations

FAISS_INDEX = settings.embeddings_dir / "faiss_index"

SYSTEM_PROMPT = """You are a precise nursing knowledge assistant.
Answer questions STRICTLY based on the provided nursing documents shown below.
Cite the document name and page number for every factual claim you make.
If the answer is not found in the documents, say exactly:
"I could not find this information in the uploaded documents."
Never use outside knowledge or make assumptions.
Be clinically accurate, concise, and professional.

Relevant document excerpts:
{context}"""

class RAGService:
    def __init__(self):
        self._embeddings = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
        self._llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            openai_api_key=settings.openai_api_key,
        )
        self._vectorstore: Optional[FAISS] = None
        self._retriever = None
        self._chat_history: List = []
        if FAISS_INDEX.exists():
            self._load_index()

    @property
    def is_ready(self) -> bool:
        return self._retriever is not None

    def ingest_all(self) -> dict:
        pdf_files = list(settings.data_dir.glob("*.pdf"))
        if not pdf_files:
            return {"status": "no_pdfs", "files": [], "chunks": 0}
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        all_docs, loaded = [], []
        for path in pdf_files:
            try:
                pages  = PyPDFLoader(str(path)).load()
                chunks = splitter.split_documents(pages)
                all_docs.extend(chunks)
                loaded.append(path.name)
                print(f"  ✓ {path.name} ({len(chunks)} chunks)")
            except Exception as e:
                print(f"  ✗ {path.name}: {e}")
        if not all_docs:
            return {"status": "error", "files": [], "chunks": 0,
                    "message": "No documents could be loaded."}
        self._vectorstore = FAISS.from_documents(all_docs, self._embeddings)
        settings.embeddings_dir.mkdir(exist_ok=True)
        self._vectorstore.save_local(str(FAISS_INDEX))
        self._build_retriever()
        return {"status": "success", "files": loaded, "chunks": len(all_docs)}

    def query(self, question: str) -> dict:
        if not self.is_ready:
            return {"answer": "No documents loaded yet. Please upload PDFs first.",
                    "sources": [], "history_length": 0}
        source_docs = self._retriever.invoke(question)
        context = "\n\n---\n\n".join(
            f"[{Path(d.metadata.get('source','?')).name} p.{d.metadata.get('page','?')}]\n{d.page_content}"
            for d in source_docs
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}"),
        ])
        chain  = prompt | self._llm | StrOutputParser()
        answer = chain.invoke({
            "context":      context,
            "chat_history": self._chat_history[-settings.memory_window * 2:],
            "question":     question,
        })
        self._chat_history.append(HumanMessage(content=question))
        self._chat_history.append(AIMessage(content=answer))
        return {"answer": answer, "sources": format_citations(source_docs),
                "history_length": len(self._chat_history) // 2}

    def clear_memory(self) -> None:
        self._chat_history = []

    def reload_index(self) -> None:
        if FAISS_INDEX.exists():
            self._load_index()

    def _load_index(self) -> None:
        try:
            self._vectorstore = FAISS.load_local(
                str(FAISS_INDEX), self._embeddings,
                allow_dangerous_deserialization=True)
            self._build_retriever()
            print("✓ FAISS index loaded.")
        except Exception as e:
            print(f"⚠ Could not load index: {e}")

    def _build_retriever(self) -> None:
        if self._vectorstore:
            self._retriever = self._vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": settings.retriever_k})