"""
ilm.io — FastAPI backend
Run: uvicorn main:app --reload --port 8000
"""
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from services import artifact_cache

_logger = logging.getLogger(__name__)

from config import settings
from routers import upload, generate, chat, analytics, students, reports, agents

app = FastAPI(
    title="ilm.io API",
    description="AI teaching assistant backend for neurodivergent learners",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS — allow localhost and any ngrok tunnel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_origin_regex=r"https?://(localhost:\d+|127\.0\.0\.1:\d+|.*\.ngrok-free\.app|.*\.ngrok\.io|.*\.ngrok-free\.dev|.*\.ngrok\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Mount all routers under /api
for router in [
    upload.router,
    generate.router,
    chat.router,
    analytics.router,
    students.router,
    reports.router,
    agents.router,
]:
    app.include_router(router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ilm.io API"}


@app.get("/api/download/{job_id}")
async def download_artifact(job_id: str):
    """Serve any generated file (PPTX, PDF, MP3) from the in-memory artifact cache."""
    entry = artifact_cache.get(job_id)
    if not entry:
        raise HTTPException(404, "File not found or server was restarted. Please regenerate.")
    data, content_type, filename = entry
    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    _logger.exception("Unhandled exception on %s: %s", request.url, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
