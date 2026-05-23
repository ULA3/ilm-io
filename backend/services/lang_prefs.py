"""Shared language names and LLM instructions for ilm.io (YTL ILMU AI)."""

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "ms": "Bahasa Melayu",
    "zh": "Mandarin Chinese (Simplified)",
    "ta": "Tamil",
    "rojak": "Malaysian Rojak / Manglish",
}

ROJAK_INSTRUCTION = (
    "\n\nIMPORTANT — Malaysian Rojak / Manglish:\n"
    "Write ALL user-facing string values in natural everyday Malaysian speech — "
    "a comfortable mix of English and Bahasa Melayu (like WhatsApp with friends).\n"
    "Use particles when they fit: lah, lor, kan, eh, mah, boleh, aiyoo, confirm, okay what.\n"
    "Do NOT force every sentence to have particles. Sound human, not caricature.\n"
    "JSON keys must stay in English. Only string values use rojak style.\n"
    "Light 中文 or தமிழ் words are okay only if they fit naturally — never forced."
)


def lang_instruction(lang: str, *, keys_english: bool = True) -> str:
    """Append to agent prompts for slides, worksheets, etc."""
    if lang == "en":
        return ""
    if lang == "rojak":
        return ROJAK_INSTRUCTION
    name = LANGUAGE_NAMES.get(lang, "English")
    key_note = (
        "JSON keys must remain in English. Only the values (strings) should be in "
        f"{name}."
        if keys_english
        else f"Only string values should be in {name}."
    )
    return (
        f"\n\nIMPORTANT: Generate ALL output text (titles, bullets, narratives, labels, "
        f"descriptions) in {name}. {key_note}"
    )


def chat_lang_instruction(lang: str) -> str:
    """Extra system prompt for Ilm free chat."""
    if lang == "en":
        return ""
    if lang == "rojak":
        return (
            "\n\nLANGUAGE: Reply in Malaysian Rojak / Manglish — natural EN+BM mix "
            "(lah, kan, boleh when they fit). Warm kakak/abang vibe. Not textbook English."
        )
    name = LANGUAGE_NAMES.get(lang, "English")
    return f"\n\nLANGUAGE: Reply entirely in {name}. Keep the same warm, casual tone."


def reply_language_note(lang: str) -> str:
    """Short line for check-answer and similar one-shot calls."""
    if lang == "en":
        return "Reply in English."
    if lang == "rojak":
        return "Reply in Malaysian Rojak / Manglish (natural EN+BM mix)."
    name = LANGUAGE_NAMES.get(lang, "English")
    return f"Reply in {name}."
