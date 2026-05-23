"""
Document processor — extracts clean text from PDF, images, audio, and DOCX.

All public functions are synchronous so they can be safely run via
FastAPI's run_in_threadpool without asyncio nesting issues.
Audio transcription uses asyncio.run() internally (safe from a thread
because thread-pool threads have no existing event loop).
"""
from __future__ import annotations
import asyncio
import io
import tempfile
import os
from pathlib import Path

import fitz                         # PyMuPDF
from PIL import Image
import pytesseract
from docx import Document as DocxDocument

# On Windows Tesseract is often installed but not on PATH — find it automatically
import shutil as _shutil
if not _shutil.which("tesseract"):
    _win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(_win_path):
        pytesseract.pytesseract.tesseract_cmd = _win_path

from models.schemas import FileType


def _detect_file_type(filename: str) -> FileType:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return FileType.pdf
    if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}:
        return FileType.image
    if ext in {".mp3", ".wav", ".m4a", ".ogg", ".flac"}:
        return FileType.audio
    if ext in {".docx", ".doc"}:
        return FileType.docx
    raise ValueError(f"Unsupported file type: {ext}")


# ── PDF ───────────────────────────────────────────────────────────────────

def _extract_pdf(file_bytes: bytes) -> tuple[str, int]:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages: list[str] = []
    for page in doc:
        text = page.get_text("text").strip()
        if text:
            pages.append(text)
        else:
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            ocr = pytesseract.image_to_string(img, lang="eng").strip()
            if ocr:
                pages.append(ocr)
    doc.close()
    return "\n\n".join(pages), len(pages)


# ── Image ─────────────────────────────────────────────────────────────────

def _extract_image(file_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(file_bytes))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    return pytesseract.image_to_string(img, lang="eng").strip()


# ── DOCX ──────────────────────────────────────────────────────────────────

def _extract_docx(file_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        doc = DocxDocument(tmp_path)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    finally:
        os.unlink(tmp_path)


# ── Audio (Whisper via OpenAI) ────────────────────────────────────────────

async def _transcribe_audio_async(file_bytes: bytes, filename: str) -> str:
    from openai import AsyncOpenAI
    from config import settings
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY not set — required for audio transcription.")
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    ext = Path(filename).suffix.lower().lstrip(".")
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        with open(tmp_path, "rb") as f:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1", file=f, response_format="text"
            )
        return transcript.strip()
    finally:
        os.unlink(tmp_path)


def _extract_audio(file_bytes: bytes, filename: str) -> str:
    # Safe to call asyncio.run() from a thread-pool thread (no existing loop)
    return asyncio.run(_transcribe_audio_async(file_bytes, filename))


# ── Public entry point (synchronous) ─────────────────────────────────────

def extract_text(file_bytes: bytes, filename: str) -> dict:
    """
    Synchronous. Run via run_in_threadpool from an async route.
    Returns: {text, file_type, word_count, page_count}
    """
    file_type = _detect_file_type(filename)
    page_count = None

    if file_type == FileType.pdf:
        text, page_count = _extract_pdf(file_bytes)
    elif file_type == FileType.image:
        text = _extract_image(file_bytes)
    elif file_type == FileType.audio:
        text = _extract_audio(file_bytes, filename)
    elif file_type == FileType.docx:
        text = _extract_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported: {file_type}")

    if not text.strip():
        text = "[No readable text could be extracted from this file.]"

    return {
        "text": text,
        "file_type": file_type,
        "word_count": len(text.split()),
        "page_count": page_count,
    }
