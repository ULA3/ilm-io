"""In-memory store for structured learning pockets, keyed by file_id + language."""
from __future__ import annotations

_cache: dict[str, dict] = {}


def _key(file_id: str, lang: str = "en") -> str:
    return f"{file_id}:{lang or 'en'}"


def store(file_id: str, pockets: dict, lang: str = "en") -> None:
    _cache[_key(file_id, lang)] = pockets


def get(file_id: str, lang: str = "en") -> dict | None:
    return _cache.get(_key(file_id, lang))
