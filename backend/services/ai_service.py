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
    "tired":   "The student is currently tired. Use shorter sentences — max one sentence per point. Be extra gentle and add more encouragement. Reduce content by 50%.",
    "stressed": "The student is currently stressed. Be especially warm. Keep replies very short. Lead with empathy before any explanation.",
    "good":    "The student is in a good mood. Normal pacing is fine.",
    "okay":    "",
}


def chat_response(
    role: str,
    message: str,
    history: list[dict],
    context_text: str = "",
    mood: str = "okay",
) -> dict:
    """Returns {message: str, suggestions: list[str]}. Single LLM call."""
    mood_instr = _MOOD_PREFIX.get(mood, "")
    mood_prefix = f"{mood_instr}\n\n" if mood_instr else ""

    if role == "student":
        system = (
            f"{mood_prefix}"
            "Your name is Ilm. You are a warm, friendly Malaysian learning companion for "
            "students — especially those with ADHD, dyslexia, or autism.\n\n"
            "Your personality: You talk like a Malaysian friend — relaxed, warm, a bit playful. "
            "Use natural Manglish where it fits: 'lah', 'ah', 'kan', 'boleh', 'okay what'. "
            "Don't force it — keep it natural, like how a friendly Malaysian older sibling talks.\n\n"
            "Rules:\n"
            "- Never tell the student they are wrong. Say 'eh let me explain it differently lah'.\n"
            "- Max 3 short bullet points per reply. Each bullet max 12 words.\n"
            "- When the student seems frustrated, respond with empathy first ('aiyoh, I understand lah').\n"
            "- End with ONE short encouraging sentence.\n"
            "- Always reply in the same language the student used (EN/BM/ZH/TA).\n\n"
            'Reply ONLY in JSON: {"message": "<your reply>", "suggestions": ["<follow-up q 1>", "<follow-up q 2>"]}'
        )
    else:
        system = (
            f"{mood_prefix}"
            "Your name is Ilm. You are an expert educational advisor specialising in "
            "neurodivergent teaching strategies for Malaysian classrooms. "
            "Give evidence-based, practical advice. Reference conditions (ADHD, dyslexia, autism) "
            "when relevant. Be concise and professional. Use Malaysian educational context: "
            "KSSM, Sekolah Kebangsaan, OKU, Bank Islam, DuitNow.\n\n"
            "When explaining concepts use bullet points (•) rather than long paragraphs. "
            "Max 3 bullets per reply. Keep each bullet under 12 words.\n\n"
            'Reply ONLY in JSON: {"message": "<your reply>", "suggestions": ["<follow-up q 1>", "<follow-up q 2>"]}'
        )

    messages: list[dict] = [{"role": "system", "content": system}]
    if context_text:
        messages.append({"role": "user",      "content": f"[Document context]\n{context_text[:2000]}"})
        messages.append({"role": "assistant", "content": "I've read the document. How can I help?"})
    for m in history[-10:]:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": message})

    resp = _client.chat.completions.create(
        model=_MODEL,
        max_tokens=500,
        messages=messages,
        temperature=0.5,
    )
    raw = resp.choices[0].message.content or ""
    try:
        result = _parse_json(raw)
        return {
            "message":     result.get("message", raw),
            "suggestions": result.get("suggestions", []),
        }
    except Exception:
        return {"message": raw, "suggestions": []}


# ── Language support (mirrored from agent_service for standalone use) ─────

_LANGUAGE_NAMES = {
    "en": "English",
    "ms": "Bahasa Melayu",
    "zh": "Mandarin Chinese (Simplified)",
    "ta": "Tamil",
}

def _lang_instruction(lang: str) -> str:
    name = _LANGUAGE_NAMES.get(lang, "English")
    if lang == "en":
        return ""
    return (
        f"\n\nIMPORTANT: Generate ALL output text (titles, explanations, examples, takeaways) "
        f"in {name}. JSON keys must remain in English. "
        f"Only the string values should be in {name}."
    )


# ── Worksheet answer checker ───────────────────────────────────────────────

def check_worksheet_answer(
    question: str,
    student_answer: str,
    model_answer: str = "",
    hint: str = "",
    lang: str = "en",
) -> dict:
    """Check a student's short-answer worksheet response. Returns {correct, feedback, suggestion}."""
    lang_name = _LANGUAGE_NAMES.get(lang, "English")
    lang_instr = f"Reply in {lang_name}." if lang != "en" else "Reply in English."
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
