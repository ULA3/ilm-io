"""Shared document length limits for ILMU prompts."""

TEXT_LIMIT = 14_000


def prepare_document_text(text: str) -> tuple[str, bool]:
    """Return text for LLM prompts and whether the source was truncated."""
    text = (text or "").strip()
    if len(text) <= TEXT_LIMIT:
        return text, False

    chunk = text[:TEXT_LIMIT]
    for sep in ("\n\n", "\n", ". ", "? ", "! ", "; "):
        idx = chunk.rfind(sep)
        if idx > int(TEXT_LIMIT * 0.65):
            return chunk[: idx + len(sep)].strip(), True

    return chunk.rstrip() + "…", True
