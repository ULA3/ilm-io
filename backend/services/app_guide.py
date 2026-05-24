"""ilm.io UI & navigation knowledge for Ilm assistants (all chatbots)."""

from __future__ import annotations

# Action IDs the frontend can execute (must match lib/ilm-assistant-actions.ts)
ASSISTANT_ACTION_IDS: dict[str, str] = {
    "open_controls": "Open the Controls panel (left edge tab: font, contrast, motion, music, dark mode)",
    "music_off": "Pause / turn off background study music",
    "music_on": "Resume background music (if user had it playing)",
    "dark_on": "Turn on dark mode",
    "dark_off": "Turn on light mode",
    "reduce_motion_on": "Turn on reduce motion (less animation)",
    "reduce_motion_off": "Allow animations again",
    "high_contrast_on": "High contrast mode",
    "high_contrast_off": "Normal contrast",
    "dyslexic_font_on": "OpenDyslexic-friendly font",
    "dyslexic_font_off": "Default font",
    "font_larger": "Increase text size",
    "font_smaller": "Decrease text size",
    "auto_read_on": "Auto-read Ilm replies aloud (TTS)",
    "auto_read_off": "Stop auto-reading replies",
    "lang_en": "Switch UI language to English",
    "lang_ms": "Switch UI language to Bahasa Melayu",
    "lang_zh": "Switch UI language to Mandarin",
    "lang_ta": "Switch UI language to Tamil",
    "lang_rojak": "Switch UI language to Malaysian Rojak / Manglish",
    "open_mood_picker": "Open how-are-you-feeling mood check-in (student only)",
    "toggle_focus_mode": "Toggle student focus mode (dims distractions)",
    "scroll_student_upload": "Scroll to upload area on student page",
    "scroll_educator_upload": "Scroll to upload area on educator page",
    "open_class_panel": "Show educator class / Student Observer sidebar",
    "close_class_panel": "Hide educator class sidebar",
    "go_student": "Go to student learning page",
    "go_educator": "Go to educator / teacher page",
    "go_home": "Go to landing home page",
}

APP_UI_GUIDE = """
ilm.io APP GUIDE (use this to answer "how do I…" questions, not only study content):

GLOBAL — every page:
• Controls tab on the LEFT edge of the screen (drag vertically). Opens: text size, dyslexic font, high contrast, reduce motion, auto-read Ilm aloud, dark/light mode, background study music (play/pause, volume, track).
• Language dropdown in the header (English, BM, 中文, தமிழ், Rojak).
• Ilm chat bubble bottom-right (✦): ask study questions OR how to use the app.
• Cute background decorations are low-opacity; reduce motion in Controls if distracting.

LANDING (/):
• Choose Student or Educator. Ilm chat works before upload — ask about features or where to go.

STUDENT (/student):
• Mood check-in when you arrive (or tap mood chip in sidebar) — affects Ilm tone.
• Upload: drag-drop or camera for PDF, DOCX, MP3, WAV, JPG, PNG → Reader builds concept pockets.
• Output formats after upload: ADHD slides, autism slides, dyslexia slides, audio script, worksheets, etc.
• Focus mode button in header — hides extra UI for concentration.
• Sidebar: journey steps, language, mood.

EDUCATOR (/educator):
• Upload class material (same file types) → concept pockets → generate ADHD/Autism/Dyslexia slides, transcriber, worksheets, quizzes.
• "My class" / class panel: Student Observer roster and who needs attention.
• Ilm Educator (✦, terra colour): teaching tips + how to use pipeline outputs.

When the user wants something turned OFF or changed (music, motion, language, dark mode, class panel, focus mode):
1. Explain briefly in their language WHERE to change it manually (Controls tab on the left, language dropdown in header, mood chip on student page, class panel on educator page).
2. Do NOT offer tap-to-run action buttons — Ilm chat cannot change settings or navigate the app.
3. Never claim you changed a setting; only the user can, using the real UI controls.
"""

ACTIONS_PROMPT_BLOCK = (
    "\nIlm chat is read-only for app settings — no action buttons, no automatic UI changes. "
    "Direct users to Controls (left tab), header language menu, or the relevant page control."
)


def format_app_context(page: str = "", extra: str = "") -> str:
    parts = [APP_UI_GUIDE, ACTIONS_PROMPT_BLOCK]
    if page:
        parts.append(f"\nUser is currently on page: {page}")
    if extra:
        parts.append(f"\nLive UI snapshot:\n{extra}")
    return "\n".join(parts)


def actions_for_role(page: str, role: str) -> list[str]:
    """Subset of action ids valid for this page/role."""
    common = [
        "open_controls", "music_off", "music_on", "dark_on", "dark_off",
        "reduce_motion_on", "reduce_motion_off", "high_contrast_on", "high_contrast_off",
        "dyslexic_font_on", "dyslexic_font_off", "font_larger", "font_smaller",
        "auto_read_on", "auto_read_off",
        "lang_en", "lang_ms", "lang_zh", "lang_ta", "lang_rojak",
        "go_student", "go_educator", "go_home",
    ]
    if page == "student" or role == "student":
        return common + ["open_mood_picker", "toggle_focus_mode", "scroll_student_upload"]
    if page == "educator" or role == "teacher":
        return common + ["scroll_educator_upload", "open_class_panel", "close_class_panel"]
    if page == "landing":
        return common
    return common
