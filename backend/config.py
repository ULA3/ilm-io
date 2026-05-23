from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── YTL ILMU AI — primary LLM (nemo-super, OpenAI-compatible) ────────────
    # Get at: https://ilmu.ai  — powers all text generation and agentic pipeline
    ilmu_api_key: str
    ilmu_base_url: str = "https://api.ilmu.ai/v1"
    ilmu_model: str = "nemo-super"

    # ── OpenAI — optional, used only for Whisper audio transcription ─────────
    openai_api_key: str = ""

    # ── ElevenLabs — high-quality TTS for audiobook generation ───────────────
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "EXAVITQu4vr4xnSDxMaL"

    # ── Supabase ─────────────────────────────────────────────────────────────
    supabase_url: str
    supabase_service_key: str
    supabase_storage_bucket: str = "ilmio-uploads"

    # ── App ───────────────────────────────────────────────────────────────────
    environment: str = "development"
    frontend_url: str = "http://localhost:3000"
    max_upload_mb: int = 50


settings = Settings()
