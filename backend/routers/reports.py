from __future__ import annotations
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool

from models.schemas import WeeklyReport
from services import ai_service, supabase_client

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[WeeklyReport])
async def list_reports():
    rows = await supabase_client.get_reports(limit=5)
    return [_row_to_report(r) for r in rows]


@router.post("/generate", response_model=WeeklyReport)
async def generate_report():
    """Trigger a new weekly AI-generated report (call from a scheduler or manually)."""
    # Gather data
    students = await supabase_client.get_all_students()
    heatmap_raw = await supabase_client.get_heatmap_data()

    week_num = datetime.utcnow().isocalendar()[1]
    week_label = f"Week {week_num} · {datetime.utcnow().strftime('%b %Y')}"

    engagement_summary = {
        "total_events": len(heatmap_raw),
        "unique_students": len({r.get("student_id") for r in heatmap_raw if r.get("student_id")}),
        "avg_difficulty": (
            sum(float(r["difficulty"]) for r in heatmap_raw if r.get("difficulty")) /
            max(len([r for r in heatmap_raw if r.get("difficulty")]), 1)
        ),
    }

    result = await run_in_threadpool(
        ai_service.generate_weekly_report,
        week_label,
        students,
        engagement_summary,
    )

    report_id = str(uuid.uuid4())
    record = {
        "id": report_id,
        "week_label": week_label,
        "summary": result["summary"],
        "highlights": result["highlights"],
        "recommendations": result["recommendations"],
        "download_url": f"/api/reports/{report_id}.pdf",
    }
    await supabase_client.save_report(record)

    return WeeklyReport(
        id=report_id,
        week_label=week_label,
        generated_at=datetime.utcnow(),
        summary=result["summary"],
        highlights=result["highlights"],
        recommendations=result["recommendations"],
        download_url=f"/api/reports/{report_id}.pdf",
    )


def _row_to_report(row: dict) -> WeeklyReport:
    return WeeklyReport(
        id=row["id"],
        week_label=row["week_label"],
        generated_at=datetime.fromisoformat(row["created_at"]) if row.get("created_at") else datetime.utcnow(),
        summary=row.get("summary", ""),
        highlights=row.get("highlights") or [],
        recommendations=row.get("recommendations") or [],
        download_url=row.get("download_url", ""),
    )
