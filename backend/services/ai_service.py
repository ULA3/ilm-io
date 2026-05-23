"""
AI Service — all LLM calls for ilm.io, powered by YTL ILMU AI (nemo-super).

Provider: YTL ILMU AI  https://ilmu.ai
Model:    nemo-super   (multilingual: EN, Bahasa Melayu, 普通话, தமிழ்)
SDK:      openai       (ILMU AI exposes an OpenAI-compatible endpoint)

Every function returns structured Python objects (dicts/lists) that map
directly to Pydantic schemas. JSON is extracted with a regex fallback.
Retry: tenacity wraps each call (3 attempts, exponential back-off).
"""
from __future__ import annotations
import json
import re
from typing import Any

from tenacity import retry, stop_after_attempt, wait_exponential

from services.llm_client import client as _client, MODEL as _MODEL
from services.lang_prefs import (
    LANGUAGE_NAMES as _LANGUAGE_NAMES,
    chat_lang_instruction,
    lang_instruction as _lang_instruction,
    reply_language_note,
)


# ── Shared helpers ─────────────────────────────────────────────────────────

def _ask(system: str, user: str, max_tokens: int = 4096) -> str:
    """Synchronous ILMU AI call — FastAPI runs these via run_in_executor."""
    resp = _client.chat.completions.create(
        model=_MODEL,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.3,
    )
    return resp.choices[0].message.content or ""


def _parse_json(raw: str) -> Any:
    """Extract JSON from LLM response (handles markdown code fences)."""
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        raw = match.group(1)
    # strip any leading prose before the first [ or {
    raw = re.sub(r"^[^{\[]+", "", raw.strip())
    return json.loads(raw)


_CONDITION_GUIDE = {
    "adhd": (
        "ADHD learners: keep each slide to ONE idea, use bold verbs, "
        "add chunking markers (Step 1 / Step 2), include focus hooks."
    ),
    "dyslexia": (
        "Dyslexia learners: use short sentences (max 12 words), avoid long words, "
        "prefer phonetically simple vocabulary, use numbered lists not paragraphs."
    ),
    "autism": (
        "Autism spectrum learners: be literal, avoid idioms, use precise language, "
        "provide explicit structure, use visual schedule cues."
    ),
    "general": (
        "General neurodivergent learners: clear, concise language; "
        "chunk information; use analogies; avoid jargon."
    ),
}


# ── Slides ────────────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_slides(text: str, condition: str = "general") -> list[dict]:
    guide = _CONDITION_GUIDE.get(condition, _CONDITION_GUIDE["general"])
    system = (
        "You are an expert educational content designer specialising in neurodivergent learning. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    user = f"""
{guide}

Transform the study material below into slides. Return a JSON array where each element is:
{{
  "index": <int starting at 1>,
  "title": "<max 6 words>",
  "bullets": ["<max 10 words each>"],
  "visual_hint": "<one sentence describing a helpful diagram or image>",
  "speaker_note": "<one sentence for the presenter>"
}}

Aim for 8-12 slides. Cover all key concepts.

STUDY MATERIAL:
{text[:6000]}
"""
    return _parse_json(_ask(system, user, max_tokens=4096))


# ── Worksheet ─────────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_worksheet(text: str, condition: str = "general", difficulty: int = 2) -> dict:
    guide = _CONDITION_GUIDE.get(condition, _CONDITION_GUIDE["general"])
    system = "You are an adaptive assessment designer for neurodivergent learners. Output ONLY valid JSON."
    user = f"""
{guide}
Difficulty level: {difficulty}/3

Create a worksheet. Return JSON:
{{
  "title": "<worksheet title>",
  "adapted_for": "<condition>",
  "questions": [
    {{
      "number": <int>,
      "question": "<question text>",
      "type": "multiple_choice | short_answer | fill_blank | matching",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "<correct answer>",
      "difficulty": <1|2|3>
    }}
  ]
}}

Generate 8 questions mixing types.

STUDY MATERIAL:
{text[:5000]}
"""
    return _parse_json(_ask(system, user, max_tokens=3000))


# ── Visual Summary ────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_visual_summary(text: str) -> list[dict]:
    system = "You are an educational visual designer creating concept cards. Output ONLY valid JSON."
    user = f"""
Create 5-6 visual concept cards. Return a JSON array:
[
  {{
    "concept": "<concept name, 1-3 words>",
    "explanation": "<plain English, max 2 sentences>",
    "emoji": "<one relevant emoji>",
    "analogy": "<a vivid real-world analogy in one sentence>"
  }}
]

STUDY MATERIAL:
{text[:5000]}
"""
    return _parse_json(_ask(system, user, max_tokens=2000))


# ── Simplified Text ───────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_simplified_text(text: str) -> dict:
    system = (
        "You are a plain-language specialist. Rewrite academic text so a 12-year-old can understand it. "
        "Output ONLY valid JSON."
    )
    user = f"""
Simplify into sections. Return JSON:
{{
  "sections": [
    {{
      "heading": "<section title>",
      "text": "<simplified paragraph — short sentences, no jargon>",
      "key_idea": "<the single most important takeaway in ≤10 words>"
    }}
  ]
}}

4-6 sections. Replace every technical term with a plain equivalent.

STUDY MATERIAL:
{text[:6000]}
"""
    return _parse_json(_ask(system, user, max_tokens=3000))


# ── Educator — condition-specific outputs ─────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_educator_content(text: str, kind: str, condition: str) -> dict:
    guide = _CONDITION_GUIDE.get(condition, _CONDITION_GUIDE["general"])

    kind_prompts: dict[str, str] = {
        "chunked_slides": f"{guide}\nChunk material into ADHD micro-slides. Return JSON: {{\"chunks\": [{{\"title\": str, \"content\": str, \"timer_minutes\": int}}]}}",
        "focus_timer":    f"{guide}\nDesign Pomodoro-style sessions. Return JSON: {{\"sessions\": [{{\"label\": str, \"duration_minutes\": int, \"task\": str, \"break_activity\": str}}]}}",
        "interactive_quiz": f"{guide}\nCreate an interactive quiz with fun facts. Return JSON: {{\"questions\": [{{\"q\": str, \"options\": [str], \"answer\": str, \"fun_fact\": str}}]}}",
        "audio_version":  f"{guide}\nRewrite as a natural-sounding audio script. Return JSON: {{\"script\": str, \"estimated_minutes\": int}}",
        "high_contrast_pdf": f"{guide}\nRewrite dyslexia-friendly (short sentences). Return JSON: {{\"sections\": [{{\"heading\": str, \"body\": str}}]}}",
        "word_reader":    f"{guide}\nBreak into word units with syllable guides. Return JSON: {{\"words\": [{{\"word\": str, \"syllables\": str, \"definition\": str}}]}} (top 50 domain words only)",
        "visual_schedule": f"{guide}\nCreate a visual learning schedule. Return JSON: {{\"steps\": [{{\"step\": int, \"icon\": str, \"label\": str, \"duration_minutes\": int, \"description\": str}}]}}",
        "structured_outline": f"{guide}\nCreate a precise structured outline. Return JSON: {{\"outline\": [{{\"section\": str, \"subsections\": [{{\"title\": str, \"points\": [str]}}]}}]}}",
        "routine_plan":   f"{guide}\nDesign a routine-based plan. Return JSON: {{\"days\": [{{\"day\": str, \"activities\": [{{\"time\": str, \"activity\": str, \"material\": str}}]}}]}}",
        "adaptive_worksheet": f"{guide}\nCreate multi-level adaptive worksheet. Return JSON: {{\"levels\": [{{\"level\": str, \"questions\": [{{\"q\": str, \"answer\": str}}]}}]}}",
        "progress_report": f"{guide}\nGenerate a student progress report template. Return JSON: {{\"sections\": [{{\"title\": str, \"content\": str, \"rating\": int}}]}}",
        "lesson_pack":    f"{guide}\nCreate a complete lesson pack. Return JSON: {{\"objectives\": [str], \"activities\": [{{\"name\": str, \"duration\": int, \"instructions\": str}}], \"assessment\": [{{\"q\": str, \"a\": str}}]}}",
    }

    system = "You are a specialist in neurodivergent educational content. Output ONLY valid JSON — no prose outside the JSON."
    prompt = kind_prompts.get(kind, kind_prompts["adaptive_worksheet"])
    user = f"{prompt}\n\nSTUDY MATERIAL:\n{text[:5000]}"
    return _parse_json(_ask(system, user, max_tokens=3000))


# ── Student profile insights ───────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_student_insights(student_name: str, condition: str, engagement_data: list[dict]) -> list[dict]:
    system = "You are an educational AI analyst for neurodivergent learners. Output ONLY valid JSON."
    user = f"""
Analyse engagement data for student '{student_name}' (condition: {condition}).

Data (last 10 sessions):
{json.dumps(engagement_data, indent=2)}

Return a JSON array of 4-5 insights:
[{{"label": str, "value": str, "trend": "up|down|stable"}}]

Examples: {{"label": "Best focus time", "value": "Morning sessions", "trend": "stable"}}
"""
    return _parse_json(_ask(system, user, max_tokens=800))


# ── Chatbot ────────────────────────────────────────────────────────────────

_MOOD_PREFIX = {
    "tired": (
        "They sound tired right now. Reply like a gentle friend: very short, soft, "
        "no pressure. One idea at a time. 'Rest dulu also okay' energy."
    ),
    "stressed": (
        "They're stressed. Lead with empathy ('aiyoo I get it lah'). "
        "Don't dump info. Calm, human, maybe one tiny next step only."
    ),
    "good": "They're in a good mood — you can be a bit more playful and upbeat.",
    "okay": "",
}


def chat_response(
    role: str,
    message: str,
    history: list[dict],
    context_text: str = "",
    mood: str = "okay",
    lang: str = "en",
    app_context: str = "",
    app_page: str = "student",
) -> dict:
    """Returns {message, suggestions, actions}. Single LLM call."""
    from services.app_guide import format_app_context

    guide = format_app_context(app_page, app_context)
    mood_instr = _MOOD_PREFIX.get(mood, "")
    mood_prefix = f"{mood_instr}\n\n" if mood_instr else ""

    if role == "student":
        system = (
            f"{mood_prefix}"
            "You are Ilm — a real Malaysian study buddy on ilm.io, NOT a corporate chatbot.\n\n"
            "VOICE (this matters most):\n"
            "- Talk like WhatsApp with a supportive kakak/abang: warm, casual, human.\n"
            "- Use Manglish naturally when it fits: lah, lor, kan, eh, aiyoo, boleh, okay what.\n"
            "- React to what they said first ('wah good question', 'aiyoo that part confusing kan').\n"
            "- Write in flowing sentences. NO bullet lists unless they asked for steps.\n"
            "- Short is fine (1–3 sentences). Emoji sparingly (0–1), never every line.\n"
            "- Never sound like a textbook, FAQ, or 'As an AI assistant...'.\n"
            "- Never say you're an AI or language model.\n"
            "- If they're wrong, never shame them: 'eh almost there, try think of it like this...'\n"
            f"{chat_lang_instruction(lang)}\n\n"
            "GOOD example message:\n"
            '"Aiyoo photosynthesis again 😅 Okay think of it like your phone charging — '
            "leaf kena sunlight, then buat sugar. That's the main story lah. "
            'Want me to go deeper on the Calvin part?"\n\n'
            "BAD (robotic — never do this):\n"
            '"Here are three key points: • Point 1 • Point 2 • Point 3. '
            'I hope this helps! Let me know if you need anything else."\n\n'
            "You ALSO help use the ilm.io app: Controls panel (left), language, music, dark mode, "
            "mood, focus mode, upload — use the APP GUIDE below.\n\n"
            + guide
            + "\n\nsuggestions = 2 casual follow-ups (max 6 words each). "
            "actions = 0-2 UI buttons when user wants a setting changed; each "
            '{"id": "<allowed id>", "label": "<short label>"}; else [].\n\n'
            'Reply ONLY valid JSON: {"message": "...", "suggestions": ["...", "..."], "actions": []}'
        )
    else:
        system = (
            f"{mood_prefix}"
            "You are Ilm Educator — an expert educational advisor on ilm.io, powered by YTL ILMU AI (Malaysia).\n\n"
            "Help teachers with neurodivergent-inclusive strategies (ADHD, dyslexia, autism), "
            "ilm.io features (Reader pockets, slide formats, worksheets, Student Observer), "
            "and Malaysian classroom context (KSSM, SK/SMK, OKU, PdPR).\n\n"
            "Tone: warm, professional, practical — like a trusted senior colleague, not a student chatbot.\n"
            "Use bullet points (•) when listing steps. Max 3 bullets, each under 12 words.\n"
            f"{chat_lang_instruction(lang)}\n\n"
            + guide
            + '\n\nReply ONLY in JSON: {"message": "...", "suggestions": ["...", "..."], "actions": []}'
        )

    messages: list[dict] = [{"role": "system", "content": system}]
    if context_text:
        messages.append({"role": "user",      "content": f"[Document context]\n{context_text[:2000]}"})
        messages.append({
            "role": "assistant",
            "content": "Okay I've scanned your notes already. Tanya je what you stuck on — I'll explain like we're study buddies, not lecture hall 😊",
        })
    for m in history[-10:]:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": message})

    chat_temp = 0.88 if role == "student" else 0.5
    resp = _client.chat.completions.create(
        model=_MODEL,
        max_tokens=450,
        messages=messages,
        temperature=chat_temp,
    )
    raw = resp.choices[0].message.content or ""
    try:
        result = _parse_json(raw)
        actions = result.get("actions", [])
        if not isinstance(actions, list):
            actions = []
        clean_actions = []
        for a in actions[:2]:
            if isinstance(a, dict) and a.get("id"):
                clean_actions.append({
                    "id": str(a["id"]),
                    "label": str(a.get("label", a["id"]))[:48],
                })
        return {
            "message":     result.get("message", raw),
            "suggestions": result.get("suggestions", []),
            "actions":     clean_actions,
        }
    except Exception:
        return {"message": raw, "suggestions": [], "actions": []}


# ── Worksheet answer checker ───────────────────────────────────────────────

def check_worksheet_answer(
    question: str,
    student_answer: str,
    model_answer: str = "",
    hint: str = "",
    lang: str = "en",
) -> dict:
    """Check a student's short-answer worksheet response. Returns {correct, feedback, suggestion}."""
    lang_instr = reply_language_note(lang)
    system = (
        "You are Ilm, a warm Malaysian AI tutor checking a student's worksheet answer. "
        "Be encouraging — never harsh. If the answer is partly right, acknowledge what's correct. "
        f"{lang_instr} Reply ONLY in JSON."
    )
    user = f"""
Question: {question}
{f"Hint given: {hint}" if hint else ""}
{f"Model answer: {model_answer}" if model_answer else ""}
Student's answer: {student_answer}

Assess the student's answer. Return JSON:
{{
  "correct": true/false/partial,
  "feedback": "<1-2 encouraging sentences about their answer>",
  "suggestion": "<1 sentence tip for improvement or confirmation if fully correct>"
}}
"""
    raw = _ask(system, user, max_tokens=300)
    try:
        return _parse_json(raw)
    except Exception:
        return {"correct": "partial", "feedback": raw, "suggestion": ""}


# ── Financial Literacy ─────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_financial_literacy(text: str, condition: str = "general", lang: str = "en") -> dict:
    """Generate accessible financial literacy lesson for Malaysian learners."""
    guide = _CONDITION_GUIDE.get(condition, _CONDITION_GUIDE["general"])
    lang_instr = _lang_instruction(lang)
    system = (
        "You are a financial literacy educator specialising in accessible Malaysian "
        "personal finance education. Output ONLY valid JSON — no prose outside the JSON."
    )
    user = f"""
{guide}{lang_instr}

Rewrite the study material below as an accessible financial literacy lesson for Malaysian learners.
Include Malaysian context where relevant: Ringgit (RM), DuitNow, EPF/KWSP, zakat, takaful, savings.

Return JSON:
{{
  "title": "<lesson title>",
  "concepts": [
    {{
      "concept": "<concept name, 1-3 words>",
      "explanation": "<plain explanation, max 2 sentences>",
      "example": "<real-world Malaysian example with RM amounts or familiar services>",
      "takeaway": "<key takeaway in ≤10 words>",
      "emoji": "<one relevant emoji>"
    }}
  ]
}}

Generate 4-6 concepts covering the most important financial ideas in the material.

STUDY MATERIAL:
{text[:5000]}
"""
    return _parse_json(_ask(system, user, max_tokens=2500))


# ── Explain-It-Like style generator ───────────────────────────────────────

_STYLE_GUIDES = {
    "simple": (
        "Explain the material as if the student is 10 years old. "
        "Use the simplest possible words. No jargon whatsoever. "
        "Use short sentences. Relate to everyday childhood experiences."
    ),
    "story": (
        "Turn the key concepts into a short narrative story with named characters. "
        "The story should feel fun and relatable. Weave the facts into the plot naturally. "
        "End with a 1-sentence moral or takeaway that summarises the concept."
    ),
    "steps": (
        "Present the material ONLY as numbered step-by-step instructions, like a recipe. "
        "Each step must start with an action verb. Max 8 steps. Nothing else — no intro, no outro."
    ),
    "bullets": (
        "Distil the entire material into EXACTLY 3 bullet points. "
        "Each bullet is one sentence, max 12 words. "
        "These must be the 3 most important takeaways. Nothing else."
    ),
}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_with_style(text: str, style: str, condition: str = "general", lang: str = "en") -> dict:
    """Generate an 'explain it like' styled explanation of the study material."""
    guide = _CONDITION_GUIDE.get(condition, _CONDITION_GUIDE["general"])
    style_guide = _STYLE_GUIDES.get(style, _STYLE_GUIDES["simple"])
    lang_instr = _lang_instruction(lang)
    system = (
        "You are Ilm, a warm learning companion. Output ONLY valid JSON — no prose outside the JSON."
    )
    user = f"""
{guide}

Style instruction — {style.upper()}:
{style_guide}
{lang_instr}

Apply this style to the study material below and return JSON:
{{
  "style": "{style}",
  "title": "<a friendly title for this explanation, max 8 words>",
  "content": "<the styled explanation — plain text, use \\n for line breaks, use • for bullets if needed>"
}}

STUDY MATERIAL:
{text[:5000]}
"""
    return _parse_json(_ask(system, user, max_tokens=1500))


# ── Re-explain (understanding check) ──────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_reexplain(
    concept: str,
    original_explanation: str,
    condition: str = "general",
    lang: str = "en",
    attempt: int = 1,
) -> dict:
    """Try a different explanation approach based on attempt number."""
    if attempt >= 4:
        return {
            "message": (
                "Let us try talking to your teacher about this together. "
                "Sometimes a concept needs a real conversation."
            ),
            "approach_used": "teacher_referral",
        }

    approaches = {
        1: (
            "analogy",
            "Try explaining the concept using a vivid, unexpected real-world analogy. "
            "Pick something the student would encounter in daily Malaysian life. "
            "Do NOT repeat any part of the original explanation.",
        ),
        2: (
            "visual",
            "Describe the concept as if you are describing a diagram or picture. "
            "Use spatial language: 'imagine a box on the left...', 'picture a line going up...'. "
            "Be very visual and concrete.",
        ),
        3: (
            "story",
            "Turn the concept into a tiny 3-sentence story with a character who experiences "
            "the concept in their daily life. Make it memorable and fun.",
        ),
    }

    approach_name, approach_instr = approaches[attempt]
    lang_instr = _lang_instruction(lang)
    guide = _CONDITION_GUIDE.get(condition, _CONDITION_GUIDE["general"])

    system = (
        "You are Ilm, a warm and patient learning companion. "
        "A student did not understand a concept and needs a fresh explanation. "
        "Output ONLY valid JSON."
    )
    user = f"""
{guide}
{lang_instr}

The student did not understand this concept:
CONCEPT: {concept}
ORIGINAL EXPLANATION: {original_explanation}

Approach — {approach_name.upper()}:
{approach_instr}

Return JSON:
{{
  "message": "<your new explanation — max 4 sentences, end with an encouraging sentence>",
  "approach_used": "{approach_name}"
}}
"""
    result = _parse_json(_ask(system, user, max_tokens=400))
    result["approach_used"] = approach_name
    return result


# ── Weekly report ─────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_weekly_report(week_label: str, students: list[dict], engagement_summary: dict) -> dict:
    system = "You are an educational AI generating weekly classroom reports. Output ONLY valid JSON."
    user = f"""
Generate a weekly AI report for: {week_label}

Students: {json.dumps([s.get("name") for s in students])}
Engagement: {json.dumps(engagement_summary)}

Return JSON:
{{
  "summary": "<2-sentence executive summary>",
  "highlights": ["<achievement 1>", "<achievement 2>", "<achievement 3>"],
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"]
}}
"""
    return _parse_json(_ask(system, user, max_tokens=800))
