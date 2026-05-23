"""Tests for shared language instruction helpers."""

import importlib.util
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location(
    "lang_prefs",
    _ROOT / "services" / "lang_prefs.py",
)
assert _spec and _spec.loader
_lang_prefs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_lang_prefs)

LANGUAGE_NAMES = _lang_prefs.LANGUAGE_NAMES
chat_lang_instruction = _lang_prefs.chat_lang_instruction
lang_instruction = _lang_prefs.lang_instruction
reply_language_note = _lang_prefs.reply_language_note


def test_lang_instruction_english_empty():
    assert lang_instruction("en") == ""


def test_lang_instruction_rojak_mentions_manglish():
    text = lang_instruction("rojak")
    assert "Rojak" in text or "Manglish" in text


def test_lang_instruction_malay():
    assert "Bahasa Melayu" in lang_instruction("ms")


def test_chat_lang_rojak():
    assert "Rojak" in chat_lang_instruction("rojak") or "Manglish" in chat_lang_instruction("rojak")


def test_chat_lang_english_empty():
    assert chat_lang_instruction("en") == ""


def test_reply_language_note_tamil():
    assert "Tamil" in reply_language_note("ta")


def test_language_names_includes_rojak():
    assert "rojak" in LANGUAGE_NAMES
