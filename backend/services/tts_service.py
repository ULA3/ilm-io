"""
TTS Service — converts text to MP3 bytes.

Primary:  ElevenLabs REST  POST /v1/text-to-speech/:voice_id
Fallback: OpenAI TTS (async)
"""
from __future__ import annotations

import logging
from typing import Literal

import httpx

from config import settings

_logger = logging.getLogger(__name__)

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"
ELEVENLABS_MODEL_FALLBACKS = (
    "eleven_flash_v2_5",
    "eleven_turbo_v2_5",
    "eleven_multilingual_v2",
)
MAX_ELEVENLABS_CHARS = 4500

last_provider: Literal["elevenlabs", "openai", "none"] = "none"


class ElevenLabsTtsError(Exception):
    def __init__(self, status_code: int, message: str, detail_status: str | None = None):
        self.status_code = status_code
        self.message = message
        self.detail_status = detail_status
        super().__init__(message)


async def text_to_speech(text: str) -> bytes:
    """Returns MP3 bytes. Tries ElevenLabs first, falls back to OpenAI TTS."""
    global last_provider
    if settings.elevenlabs_api_key:
        try:
            data = await _elevenlabs_tts(text)
            last_provider = "elevenlabs"
            return data
        except Exception as exc:
            _logger.warning("ElevenLabs TTS failed: %s", _format_elevenlabs_error(exc))
            if not settings.openai_api_key:
                raise RuntimeError(
                    f"ElevenLabs failed ({_format_elevenlabs_error(exc)}) "
                    "and no OpenAI fallback is configured."
                ) from exc
    if settings.openai_api_key:
        last_provider = "openai"
        _logger.info("Using OpenAI TTS fallback")
        return await _openai_tts(text)
    last_provider = "none"
    raise RuntimeError(
        "No TTS provider configured. Set ELEVENLABS_API_KEY or OPENAI_API_KEY."
    )


def _format_elevenlabs_error(err: Exception) -> str:
    if isinstance(err, ElevenLabsTtsError):
        if err.detail_status == "detected_unusual_activity":
            return (
                "ElevenLabs free tier blocked (unusual activity). "
                "Disable VPN/proxy, verify your account at elevenlabs.io, "
                "or use a paid plan. Falling back to OpenAI if configured."
            )
        if err.detail_status == "quota_exceeded":
            return "ElevenLabs monthly character quota exceeded."
        return f"HTTP {err.status_code}: {err.message}"
    return str(err)


async def _elevenlabs_tts(text: str) -> bytes:
    voice_id = settings.elevenlabs_voice_id
    url = f"{ELEVENLABS_BASE}/text-to-speech/{voice_id}"
    params = {"output_format": settings.elevenlabs_output_format}
    payload_base = {
        "text": text[:MAX_ELEVENLABS_CHARS],
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.80,
            "style": 0.10,
            "use_speaker_boost": True,
        },
    }
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    last_err: ElevenLabsTtsError | None = None
    async with httpx.AsyncClient(timeout=120.0) as client:
        for model_id in _model_candidates():
            payload = {**payload_base, "model_id": model_id}
            try:
                resp = await client.post(url, params=params, json=payload, headers=headers)
            except httpx.RequestError as exc:
                raise ElevenLabsTtsError(0, f"Network error: {exc}") from exc

            if resp.status_code == 200:
                if not resp.content:
                    raise ElevenLabsTtsError(200, "ElevenLabs returned empty audio")
                _logger.info(
                    "ElevenLabs TTS ok (model=%s, bytes=%d)", model_id, len(resp.content)
                )
                return resp.content

            err = _parse_elevenlabs_error(resp)
            if err.status_code in (401, 403) or err.detail_status in (
                "quota_exceeded",
                "detected_unusual_activity",
            ):
                raise err
            if err.status_code in (404, 422):
                _logger.debug("ElevenLabs model %s unavailable: %s", model_id, err.message)
                last_err = err
                continue
            raise err

    if last_err:
        raise last_err
    raise ElevenLabsTtsError(0, "ElevenLabs TTS failed with no successful model")


def _model_candidates() -> tuple[str, ...]:
    primary = settings.elevenlabs_model_id.strip()
    seen: set[str] = set()
    out: list[str] = []
    if primary:
        seen.add(primary)
        out.append(primary)
    for model in ELEVENLABS_MODEL_FALLBACKS:
        if model not in seen:
            seen.add(model)
            out.append(model)
    return tuple(out)


def _parse_elevenlabs_error(resp: httpx.Response) -> ElevenLabsTtsError:
    try:
        body = resp.json()
        detail = body.get("detail", {})
        if isinstance(detail, dict):
            message = detail.get("message", resp.text)
            status = detail.get("status")
        else:
            message = str(detail)
            status = None
    except Exception:
        message = resp.text or f"HTTP {resp.status_code}"
        status = None
    return ElevenLabsTtsError(resp.status_code, message, status)


async def _openai_tts(text: str) -> bytes:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    resp = await client.audio.speech.create(
        model="tts-1-hd",
        voice="nova",
        input=text[:4096],
        response_format="mp3",
        speed=0.9,
    )
    return resp.content
