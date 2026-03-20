"""
app/api/routes/documents.py
PDF upload and ingestion endpoints.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.models.schemas import IngestResponse, PDFListResponse
from app.services.document_service import list_pdfs, save_upload
from app.api.deps import get_rag, get_quiz

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/upload", response_model=IngestResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    rag=Depends(get_rag),
    quiz=Depends(get_quiz),
):
    """Upload a PDF and automatically rebuild the knowledge base."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only .pdf files are accepted.")
    contents = await file.read()
    if not contents:
        raise HTTPException(400, "File is empty.")

    save_upload(contents, file.filename)
    result = rag.ingest_all()
    quiz.reload()

    if result["status"] == "error":
        raise HTTPException(500, result.get("message", "Ingestion failed."))
    return IngestResponse(**result)


@router.post("/ingest", response_model=IngestResponse)
def ingest(rag=Depends(get_rag), quiz=Depends(get_quiz)):
    """Re-index all PDFs already in the data/ folder."""
    result = rag.ingest_all()
    quiz.reload()
    if result["status"] == "no_pdfs":
        raise HTTPException(404, "No PDFs found in data/ directory.")
    return IngestResponse(**result)


@router.get("/", response_model=PDFListResponse)
def get_pdfs():
    pdfs = list_pdfs()
    return PDFListResponse(pdfs=pdfs, count=len(pdfs))