from __future__ import annotations
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from models.schemas import StudentProfile, StudentProfileList, LearningInsight
from services import ai_service, supabase_client

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=StudentProfileList)
async def list_students():
    rows = await supabase_client.get_all_students()
    students = [_row_to_profile(r) for r in rows]
    return StudentProfileList(students=students)


@router.get("/{student_id}", response_model=StudentProfile)
async def get_student(student_id: str):
    row = await supabase_client.get_student(student_id)
    if not row:
        raise HTTPException(404, "Student not found.")
    return _row_to_profile(row)


@router.post("/{student_id}/refresh-insights", response_model=StudentProfile)
async def refresh_insights(student_id: str):
    """Re-run Claude insights on latest engagement data for a student."""
    row = await supabase_client.get_student(student_id)
    if not row:
        raise HTTPException(404, "Student not found.")

    # Fetch recent events
    from services.supabase_client import get_client
    client = get_client()
    events = (
        client.table("engagement_events")
        .select("event_type, metadata, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    ).data or []

    insights_raw = await run_in_threadpool(
        ai_service.generate_student_insights,
        row["name"],
        row.get("condition", "general"),
        events,
    )

    # Persist updated insights
    row["insights"] = insights_raw
    await supabase_client.upsert_student(row)

    return _row_to_profile(row)


@router.post("/upsert")
async def upsert_student(profile: StudentProfile):
    record = {
        "id": profile.id,
        "name": profile.name,
        "emoji": profile.emoji,
        "condition": profile.condition,
        "learning_style": profile.learning_style,
        "streak_days": profile.streak_days,
        "weekly_progress": profile.weekly_progress,
        "insights": [i.model_dump() for i in profile.insights],
        "attention_trend": profile.attention_trend,
        "last_active": profile.last_active.isoformat(),
    }
    saved = await supabase_client.upsert_student(record)
    return saved


def _row_to_profile(row: dict) -> StudentProfile:
    insights = [
        LearningInsight(**i) if isinstance(i, dict) else i
        for i in (row.get("insights") or [])
    ]
    return StudentProfile(
        id=row["id"],
        name=row["name"],
        emoji=row.get("emoji", "🌱"),
        condition=row.get("condition", "general"),
        learning_style=row.get("learning_style", "mixed"),
        streak_days=row.get("streak_days", 0),
        weekly_progress=row.get("weekly_progress", 0),
        insights=insights,
        attention_trend=row.get("attention_trend") or [],
        last_active=datetime.fromisoformat(row["last_active"]) if row.get("last_active") else datetime.utcnow(),
    )
