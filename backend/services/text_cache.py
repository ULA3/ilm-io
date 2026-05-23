"""
In-memory file text cache — maps file_id → extracted text.
Used as a fast fallback when Supabase is unavailable or not yet configured.
Survives for the lifetime of the server process.
"""
_cache: dict[str, str] = {}


def store(file_id: str, text: str) -> None:
    _cache[file_id] = text


def get(file_id: str) -> str | None:
    return _cache.get(file_id)
