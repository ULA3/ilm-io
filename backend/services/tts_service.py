"""
TTS Service — converts text to MP3 bytes.

Primary:  ElevenLabs (sync SDK wrapped in thread pool)
Fallback: OpenAI TTS (async)
"""
from __future__ import annotations
import io
from fastapi.concurrency import run_in_threadpool
from config import settings


async def text_to_speech(text: str) -> bytes:
    """Returns MP3 bytes. Tries ElevenLabs first, falls back to OpenAI TTS."""
    if settings.elevenlabs_api_key:
        try:
            return await run_in_threadpool(_elevenlabs_sync, text)
        except Exception as e:
            if not settings.openai_api_key:
                raise RuntimeError(f"ElevenLabs failed and no OpenAI fallback: {e}")
    if settings.openai_api_key:
        return await _openai_tts(text)
    raise RuntimeError(
        "No TTS provider configured. Set ELEVENLABS_API_KEY or OPENAI_API_KEY."
    )


# ── ElevenLabs (sync — run via thread pool) ───────────────────────────────

def _elevenlabs_sync(text: str) -> bytes:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import VoiceSettings

    client = ElevenLabs(api_key=settings.elevenlabs_api_key)
    audio_generator = client.text_to_speech.convert(
        voice_id=settings.elevenlabs_voice_id,
        text=text[:4500],
        model_id="eleven_turbo_v2_5",
        voice_settings=VoiceSettings(
            stability=0.55,
            similarity_boost=0.80,
            style=0.10,
            use_speaker_boost=True,
        ),
        output_format="mp3_44100_128",
    )
    buf = io.BytesIO()
    for chunk in audio_generator:
        if chunk:
            buf.write(chunk)
    data = buf.getvalue()
    if not data:
        raise RuntimeError("ElevenLabs returned empty audio")
    return data


# ── OpenAI TTS fallback (async) ───────────────────────────────────────────

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
