"""In-memory store for structured learning pockets, keyed by file_id."""
from __future__ import annotations

_cache: dict[str, dict] = {}


def store(file_id: str, pockets: dict) -> None:
    _cache[file_id] = pockets


def get(file_id: str) -> dict | None:
    return _cache.get(file_id)
