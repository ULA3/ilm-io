from __future__ import annotations
import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.concurrency import run_in_threadpool

from config import settings
from models.schemas import UploadResponse
from services import document_processor, supabase_client, text_cache

router = APIRouter(prefix="/upload", tags=["upload"])

# Accepted MIME types (browser-reported) — also validated by extension below
ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp",
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg",
    "audio/mp4", "audio/x-m4a", "audio/flac",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",  # fallback — Windows often sends this
}

# Ground-truth check by extension (more reliable than MIME on Windows)
ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp",
               ".mp3", ".wav", ".m4a", ".ogg", ".flac", ".docx"}


@router.post("", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower()

    # Validate extension
    if ext not in ALLOWED_EXT:
        raise HTTPException(415, f"Unsupported file type '{ext}'. Accepted: PDF, images, audio, DOCX.")

    # Validate size
    content = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(413, f"File exceeds {settings.max_upload_mb} MB limit.")

    file_id = str(uuid.uuid4())
    storage_path = f"uploads/{file_id}{ext}"

    # ── Text extraction (sync, CPU-bound → thread pool) ───────────────────
    try:
        extraction = await run_in_threadpool(
            document_processor.extract_text, content, filename
        )
    except Exception as e:
        raise HTTPException(422, f"Could not extract text: {e}")

    # ── Supabase Storage upload (sync SDK → thread pool) ──────────────────
    content_type = file.content_type or "application/octet-stream"
    try:
        public_url = await run_in_threadpool(
            _upload_to_storage, content, storage_path, content_type
        )
    except Exception as e:
        # Non-fatal: storage may not be configured yet; log and continue
        public_url = ""

    # ── Cache text in-memory for fast generation access ──────────────────
    text_cache.store(file_id, extraction["text"])

    # ── Persist metadata (sync SDK → thread pool) ─────────────────────────
    record = {
        "id": file_id,
        "filename": filename,
        "file_type": extraction["file_type"].value,
        "text_content": extraction["text"],
        "word_count": extraction["word_count"],
        "storage_path": storage_path,
        "storage_url": public_url,
    }
    try:
        await run_in_threadpool(supabase_client.save_upload_sync, record)
    except Exception as e:
        # Non-fatal for hackathon: in-memory file_id still works for generation
        pass

    return UploadResponse(
        file_id=file_id,
        filename=filename,
        file_type=extraction["file_type"],
        text_content=extraction["text"],
        word_count=extraction["word_count"],
        storage_path=storage_path,
    )


def _upload_to_storage(file_bytes: bytes, path: str, content_type: str) -> str:
    from services.supabase_client import get_client
    from config import settings as cfg
    client = get_client()
    client.storage.from_(cfg.supabase_storage_bucket).upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return client.storage.from_(cfg.supabase_storage_bucket).get_public_url(path)
