"""Fetch educational illustrations for slide PPTX export."""
from __future__ import annotations

import hashlib
from urllib.parse import quote

import httpx

_TIMEOUT = 10.0
_MAX_BYTES = 4_000_000


def image_prompt_from_hint(visual_hint: str, title: str = "", topic: str = "") -> str:
    parts = " ".join(p for p in (visual_hint, title, topic) if p).strip()
    core = parts[:180] if parts else "classroom learning"
    return (
        "Friendly educational illustration for students, simple clear colorful diagram, "
        f"no text in image: {core}"
    )


def fetch_slide_image_bytes(visual_hint: str, title: str = "", topic: str = "") -> bytes | None:
    """Download illustration from Pollinations (demo-friendly, no API key)."""
    if not visual_hint and not title:
        return None
    prompt = image_prompt_from_hint(visual_hint or title, title, topic)
    seed = hashlib.md5(prompt.encode()).hexdigest()[:12]
    url = (
        f"https://image.pollinations.ai/prompt/{quote(prompt)}"
        f"?width=800&height=450&nologo=true&seed={seed}"
    )
    try:
        with httpx.Client(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                return None
            ctype = resp.headers.get("content-type", "")
            if not ctype.startswith("image/"):
                return None
            if len(resp.content) > _MAX_BYTES:
                return None
            return resp.content
    except Exception:
        return None
