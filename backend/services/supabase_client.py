"""
Supabase client — all functions are synchronous (supabase-py 2.x uses a sync client).
Call them via run_in_threadpool from async route handlers.

Tables: uploads, generations, students, engagement_events, chat_sessions, weekly_reports
Storage bucket: ilmio-uploads
"""
from __future__ import annotations
import asyncio
from typing import Any

from supabase import create_client, Client
from config import settings

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client


# ── Storage ───────────────────────────────────────────────────────────────

def upload_file_sync(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    client = get_client()
    client.storage.from_(settings.supabase_storage_bucket).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return client.storage.from_(settings.supabase_storage_bucket).get_public_url(storage_path)


def download_file_sync(storage_path: str) -> bytes:
    return get_client().storage.from_(settings.supabase_storage_bucket).download(storage_path)


# ── Uploads ───────────────────────────────────────────────────────────────

def save_upload_sync(record: dict[str, Any]) -> dict[str, Any]:
    resp = get_client().table("uploads").insert(record).execute()
    return resp.data[0]


def get_upload_sync(file_id: str) -> dict[str, Any] | None:
    resp = get_client().table("uploads").select("*").eq("id", file_id).maybe_single().execute()
    return resp.data


# ── Generations ───────────────────────────────────────────────────────────

def save_generation_sync(record: dict[str, Any]) -> dict[str, Any]:
    resp = get_client().table("generations").insert(record).execute()
    return resp.data[0]


def get_generation_sync(job_id: str) -> dict[str, Any] | None:
    resp = get_client().table("generations").select("*").eq("id", job_id).maybe_single().execute()
    return resp.data


# ── Students ──────────────────────────────────────────────────────────────

def get_all_students_sync() -> list[dict[str, Any]]:
    resp = get_client().table("students").select("*").order("name").execute()
    return resp.data or []


def get_student_sync(student_id: str) -> dict[str, Any] | None:
    resp = get_client().table("students").select("*").eq("id", student_id).maybe_single().execute()
    return resp.data


def upsert_student_sync(record: dict[str, Any]) -> dict[str, Any]:
    resp = get_client().table("students").upsert(record).execute()
    return resp.data[0]


# ── Engagement events ─────────────────────────────────────────────────────

def log_event_sync(record: dict[str, Any]) -> None:
    get_client().table("engagement_events").insert(record).execute()


def get_heatmap_data_sync() -> list[dict[str, Any]]:
    resp = (
        get_client().table("engagement_events")
        .select("topic, week_number, difficulty, engagement_score, event_type, student_id")
        .not_.is_("topic", "null")
        .execute()
    )
    return resp.data or []


# ── Chat sessions ─────────────────────────────────────────────────────────

def append_chat_message_sync(session_id: str, role: str, content: str) -> None:
    get_client().table("chat_sessions").insert(
        {"session_id": session_id, "role": role, "content": content}
    ).execute()


def get_chat_history_sync(session_id: str, limit: int = 20) -> list[dict[str, Any]]:
    resp = (
        get_client().table("chat_sessions")
        .select("role, content, created_at")
        .eq("session_id", session_id)
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return resp.data or []


# ── Weekly reports ────────────────────────────────────────────────────────

def save_report_sync(record: dict[str, Any]) -> dict[str, Any]:
    resp = get_client().table("weekly_reports").insert(record).execute()
    return resp.data[0]


def get_reports_sync(limit: int = 5) -> list[dict[str, Any]]:
    resp = (
        get_client().table("weekly_reports")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []


# ── Async wrappers — run sync calls in a thread so the event loop stays free ─

async def upload_file(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    return await asyncio.to_thread(upload_file_sync, file_bytes, storage_path, content_type)

async def download_file(storage_path: str) -> bytes:
    return await asyncio.to_thread(download_file_sync, storage_path)

async def save_upload(record: dict[str, Any]) -> dict[str, Any]:
    return await asyncio.to_thread(save_upload_sync, record)

async def get_upload(file_id: str) -> dict[str, Any] | None:
    return await asyncio.to_thread(get_upload_sync, file_id)

async def save_generation(record: dict[str, Any]) -> dict[str, Any]:
    return await asyncio.to_thread(save_generation_sync, record)

async def get_generation(job_id: str) -> dict[str, Any] | None:
    return await asyncio.to_thread(get_generation_sync, job_id)

async def get_all_students() -> list[dict[str, Any]]:
    return await asyncio.to_thread(get_all_students_sync)

async def get_student(student_id: str) -> dict[str, Any] | None:
    return await asyncio.to_thread(get_student_sync, student_id)

async def upsert_student(record: dict[str, Any]) -> dict[str, Any]:
    return await asyncio.to_thread(upsert_student_sync, record)

async def log_event(record: dict[str, Any]) -> None:
    await asyncio.to_thread(log_event_sync, record)

async def get_heatmap_data() -> list[dict[str, Any]]:
    return await asyncio.to_thread(get_heatmap_data_sync)

async def append_chat_message(session_id: str, role: str, content: str) -> None:
    await asyncio.to_thread(append_chat_message_sync, session_id, role, content)

async def get_chat_history(session_id: str, limit: int = 20) -> list[dict[str, Any]]:
    return await asyncio.to_thread(get_chat_history_sync, session_id, limit)

async def save_report(record: dict[str, Any]) -> dict[str, Any]:
    return await asyncio.to_thread(save_report_sync, record)

async def get_reports(limit: int = 5) -> list[dict[str, Any]]:
    return await asyncio.to_thread(get_reports_sync, limit)
