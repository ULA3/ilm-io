from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────────

class FileType(str, Enum):
    pdf = "pdf"
    image = "image"
    audio = "audio"
    docx = "docx"

class OutputKind(str, Enum):
    slides = "slides"
    audiobook = "audiobook"
    visual_summary = "visual_summary"
    worksheet = "worksheet"
    simplified_text = "simplified_text"

class EducatorOutputKind(str, Enum):
    # ADHD
    chunked_slides = "chunked_slides"
    focus_timer = "focus_timer"
    interactive_quiz = "interactive_quiz"
    # Dyslexia
    audio_version = "audio_version"
    high_contrast_pdf = "high_contrast_pdf"
    word_reader = "word_reader"
    # Autism
    visual_schedule = "visual_schedule"
    structured_outline = "structured_outline"
    routine_plan = "routine_plan"
    # General
    adaptive_worksheet = "adaptive_worksheet"
    progress_report = "progress_report"
    lesson_pack = "lesson_pack"

class Condition(str, Enum):
    adhd = "adhd"
    dyslexia = "dyslexia"
    autism = "autism"
    general = "general"

class UserRole(str, Enum):
    student = "student"
    educator = "educator"


# ── Upload ────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    file_id: str
    filename: str
    file_type: FileType
    text_content: str
    word_count: int
    storage_path: str


# ── Generation ────────────────────────────────────────────────────────────

class Slide(BaseModel):
    index: int
    title: str
    bullets: list[str]
    visual_hint: str
    speaker_note: str = ""

class GenerateSlidesResponse(BaseModel):
    job_id: str
    kind: OutputKind
    slides: list[Slide]
    download_url: str          # /api/download/{job_id}.pptx
    condition: str = "general"
    truncated: bool = False

class AudiobookResponse(BaseModel):
    job_id: str
    audio_url: str             # /api/download/{job_id}.mp3
    duration_seconds: int
    transcript: str

class VisualCard(BaseModel):
    concept: str
    explanation: str
    emoji: str
    analogy: str

class VisualSummaryResponse(BaseModel):
    job_id: str
    cards: list[VisualCard]
    download_url: str
    truncated: bool = False

class WorksheetQuestion(BaseModel):
    number: int
    question: str
    type: str                  # multiple_choice | short_answer | matching | fill_blank
    options: list[str] = []
    answer: str
    difficulty: int            # 1-3

class WorksheetResponse(BaseModel):
    job_id: str
    title: str
    questions: list[WorksheetQuestion]
    download_url: str
    adapted_for: str
    truncated: bool = False

class SimplifiedTextResponse(BaseModel):
    job_id: str
    original_word_count: int
    simplified_word_count: int
    sections: list[dict[str, str]]   # [{heading, text, key_idea}]
    download_url: str
    truncated: bool = False

class EducatorGenerateResponse(BaseModel):
    job_id: str
    kind: EducatorOutputKind
    condition: Condition
    content: dict[str, Any]
    download_url: str
    truncated: bool = False


# ── Chat ──────────────────────────────────────────────────────────────────

IlmLang = Literal["en", "ms", "zh", "ta", "rojak"]

class ChatMessage(BaseModel):
    role: str                  # user | assistant
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AssistantAction(BaseModel):
    id: str
    label: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    role: UserRole = UserRole.student
    context_file_id: str | None = None
    lang: IlmLang = "en"
    app_page: str = "student"
    app_context: str = ""

class ChatResponse(BaseModel):
    session_id: str
    message: str
    role: str = "assistant"
    suggestions: list[str] = []
    actions: list[AssistantAction] = []


# ── Students ──────────────────────────────────────────────────────────────

class LearningInsight(BaseModel):
    label: str
    value: str
    trend: str = "stable"      # up | down | stable

class StudentProfile(BaseModel):
    id: str
    name: str
    emoji: str
    condition: str
    learning_style: str
    streak_days: int
    weekly_progress: int       # 0-100
    insights: list[LearningInsight]
    attention_trend: list[int] # last 7 sessions, 0-100
    last_active: datetime

class StudentProfileList(BaseModel):
    students: list[StudentProfile]


# ── Analytics ─────────────────────────────────────────────────────────────

class EngagementEvent(BaseModel):
    student_id: str
    session_id: str
    event_type: str            # slide_view | quiz_answer | chatbot_open | download
    metadata: dict[str, Any] = {}

class HeatmapCell(BaseModel):
    topic: str
    week: int
    difficulty: float          # 1.0-5.0
    engagement: float          # 0.0-1.0

class HeatmapResponse(BaseModel):
    topics: list[str]
    weeks: list[str]
    cells: list[HeatmapCell]

class AnalyticsBar(BaseModel):
    label: str
    value: int                 # 0-100
    color: str


# ── Reports ───────────────────────────────────────────────────────────────

class WeeklyReport(BaseModel):
    id: str
    week_label: str
    generated_at: datetime
    summary: str
    highlights: list[str]
    recommendations: list[str]
    download_url: str


# ── Download ──────────────────────────────────────────────────────────────

class DownloadMeta(BaseModel):
    job_id: str
    filename: str
    content_type: str
    size_bytes: int
