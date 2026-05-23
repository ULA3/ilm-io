"""
Artifact cache — in-memory store for generated files (PPTX, PDF, MP3).
On store: also uploads to Supabase Storage as a backup.
On get: returns from memory if present; otherwise fetches from Supabase.
"""
from __future__ import annotations
import json
import logging

_cache: dict[str, tuple[bytes, str, str]] = {}
_logger = logging.getLogger(__name__)


def store(job_id: str, data: bytes, content_type: str, filename: str) -> None:
    _cache[job_id] = (data, content_type, filename)
    try:
        from services import supabase_client
        prefix = f"artifacts/{job_id}"
        supabase_client.upload_file_sync(data, f"{prefix}/{filename}", content_type)
        meta = json.dumps({"content_type": content_type, "filename": filename}).encode()
        supabase_client.upload_file_sync(meta, f"{prefix}/meta.json", "application/json")
    except Exception as exc:
        _logger.warning("Supabase artifact backup failed for %s: %s", job_id, exc)


def get(job_id: str) -> tuple[bytes, str, str] | None:
    cached = _cache.get(job_id)
    if cached:
        return cached
    # Fallback: try to recover from Supabase Storage after a server restart
    try:
        from services import supabase_client
        prefix = f"artifacts/{job_id}"
        meta_bytes = supabase_client.download_file_sync(f"{prefix}/meta.json")
        meta = json.loads(meta_bytes)
        data = supabase_client.download_file_sync(f"{prefix}/{meta['filename']}")
        entry = (data, meta["content_type"], meta["filename"])
        _cache[job_id] = entry  # restore to in-memory cache
        return entry
    except Exception:
        return None
