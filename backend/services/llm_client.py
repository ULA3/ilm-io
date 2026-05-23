"""
Shared LLM client for ilm.io — YTL ILMU AI (nemo-super).

This is the single "brain" for ilm.io: chatbot (Ilm), ilmuist, agents,
slides, worksheets, and student action buttons all import from here.

Provider : YTL ILMU AI  https://api.ilmu.ai/v1  (OpenAI-compatible)
Model    : nemo-super   — Malaysian context, multilingual (EN / BM / ZH / TA)
Configure: ILMU_API_KEY, ILMU_BASE_URL, ILMU_MODEL in backend/.env
"""
from __future__ import annotations

from openai import OpenAI
from config import settings

# Single pre-configured client — reused across all LLM calls
client = OpenAI(
    api_key=settings.ilmu_api_key,
    base_url=settings.ilmu_base_url,
)

MODEL = settings.ilmu_model
