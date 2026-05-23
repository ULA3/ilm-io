from __future__ import annotations
from datetime import datetime

from fastapi import APIRouter

from models.schemas import EngagementEvent, HeatmapResponse, HeatmapCell, AnalyticsBar
from services import supabase_client

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/event")
async def log_engagement_event(event: EngagementEvent):
    """Track a student interaction event (slide view, quiz answer, download, etc.)."""
    record = {
        "student_id": event.student_id,
        "session_id": event.session_id,
        "event_type": event.event_type,
        "metadata": event.metadata,
        "week_number": datetime.utcnow().isocalendar()[1],
        "topic": event.metadata.get("topic"),
        "difficulty": event.metadata.get("difficulty"),
        "engagement_score": event.metadata.get("engagement_score"),
    }
    await supabase_client.log_event(record)
    return {"status": "logged"}


@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap():
    """Aggregate engagement events into topic × week difficulty heatmap."""
    raw = await supabase_client.get_heatmap_data()

    # Group by (topic, week)
    grid: dict[tuple[str, int], list[float]] = {}
    for row in raw:
        key = (row.get("topic", "Unknown"), row.get("week_number", 1))
        if key not in grid:
            grid[key] = []
        if row.get("difficulty"):
            grid[key].append(float(row["difficulty"]))

    cells = [
        HeatmapCell(
            topic=topic,
            week=week,
            difficulty=sum(vals) / len(vals) if vals else 2.5,
            engagement=min(len(vals) / 10, 1.0),
        )
        for (topic, week), vals in grid.items()
    ]

    topics = sorted({c.topic for c in cells})
    weeks = sorted({c.week for c in cells})
    week_labels = [f"Week {w}" for w in weeks]

    return HeatmapResponse(topics=topics, weeks=week_labels, cells=cells)


@router.get("/bars")
async def get_analytics_bars() -> list[AnalyticsBar]:
    """Return engagement metric bars for the educator dashboard."""
    raw = await supabase_client.get_heatmap_data()

    # Compute simple aggregates
    total = len(raw) or 1
    quiz = sum(1 for r in raw if r.get("event_type") == "quiz_answer") / total * 100
    slides = sum(1 for r in raw if r.get("event_type") == "slide_view") / total * 100
    chat = sum(1 for r in raw if r.get("event_type") == "chatbot_open") / total * 100
    download = sum(1 for r in raw if r.get("event_type") == "download") / total * 100

    return [
        AnalyticsBar(label="Quiz completion", value=int(min(quiz * 2, 100)), color="bg-sage"),
        AnalyticsBar(label="Slide engagement", value=int(min(slides * 2, 100)), color="bg-dust"),
        AnalyticsBar(label="Chatbot usage", value=int(min(chat * 3, 100)), color="bg-honey"),
        AnalyticsBar(label="Downloads", value=int(min(download * 3, 100)), color="bg-terra"),
    ]
