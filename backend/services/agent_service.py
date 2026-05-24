"""
Multi-agent pipeline for ilm.io educator mode — powered by YTL ILMU AI (nemo-super).

Agents
──────
Reader      — Reads the raw extracted text, structures it into JSON "pockets"
              (one pocket per distinct concept). Passes result to Orchestrator.

Orchestrator — Holds pocket state; waits for teacher's output selection.
               (Implemented implicitly via pocket_cache + the /agents router.)

SlideSorter (ADHD)   — Takes pockets; produces ADHD-friendly slide JSON
                        (one idea per slide, short bullets, focus hooks, timers).

SlideSorter (Autism) — Takes pockets; produces structured, predictable slide JSON
                        (identical layout, literal language, no ambiguity).

Transcriber — Takes pockets; produces a flowing, story-driven audio script
              (natural narrative, analogies, [PAUSE] markers).
"""
from __future__ import annotations
import json
import re
from typing import Any

from tenacity import retry, stop_after_attempt, wait_exponential

from services.llm_client import client as _client, MODEL as _MODEL
from services.lang_prefs import LANGUAGE_NAMES, chat_lang_instruction, lang_instruction as _lang_instruction
from services.app_guide import format_app_context, actions_for_role
from services.text_limits import TEXT_LIMIT, prepare_document_text


# ── Shared helpers ─────────────────────────────────────────────────────────

def _ask(system: str, user: str, max_tokens: int = 4096, temperature: float = 0.3) -> str:
    resp = _client.chat.completions.create(
        model=_MODEL,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=temperature,
    )
    return resp.choices[0].message.content or ""


def _parse_json(raw: str) -> Any:
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        raw = match.group(1)
    raw = re.sub(r"^[^{\[]+", "", raw.strip())
    return json.loads(raw)


# ── Reader Agent ───────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def read_document(text: str, lang: str = "en") -> dict:
    """
    Reader Agent: deeply analyses raw text and structures it into learning pockets.

    Returns a dict with keys: topic, summary, learning_objectives, vocabulary, pockets.
    Each pocket has: id, concept, key_points, examples, complexity (1-5), pocket_type.
    """
    system = (
        "You are the Reader Agent for ilm.io — an educational AI that transforms raw "
        "document text into structured learning pockets for neurodivergent learners. "
        "Understand context, infer meaning, and organise information clearly. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    doc_text, was_truncated = prepare_document_text(text)
    user = f"""
Analyse the document below and extract structured learning pockets.

Return a single JSON object:
{{
  "topic": "<overall subject topic in 3-6 words>",
  "summary": "<2-3 sentences summarising the whole document simply>",
  "learning_objectives": [
    "<what a learner should be able to do or understand after studying this>"
  ],
  "vocabulary": [
    {{"term": "<key term>", "definition": "<simple, jargon-free definition>"}}
  ],
  "pockets": [
    {{
      "id": <int starting at 1>,
      "concept": "<concept name, max 5 words>",
      "key_points": ["<one fact or idea per item, max 10 words each>"],
      "examples": ["<one concrete, real-world example>"],
      "complexity": <integer 1–5 where 1=very simple, 5=very complex>,
      "pocket_type": "<one of: concept | fact | process | example>"
    }}
  ]
}}

Rules:
- Aim for 5–10 pockets that cover ALL distinct ideas in the document
- Use simple, clear language — avoid jargon
- Each key_point must be a standalone, self-contained statement
- Examples must be concrete and relatable to a 12-year-old

DOCUMENT:
{doc_text}
{_lang_instruction(lang)}"""
    result = _parse_json(_ask(system, user, max_tokens=3000))
    if isinstance(result, dict):
        result["truncated"] = was_truncated
        result["lang"] = lang
    return result


# ── Slide Sorter — ADHD ────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_adhd_slides(pockets_data: dict, lang: str = "en") -> list[dict]:
    """
    Slide Sorter (ADHD): converts pockets into ADHD-friendly presentation slides.

    ADHD slide principles applied:
    - One concept per slide (split complex pockets into two)
    - Max 3 bullets, each max 8 words — short, punchy, active verbs
    - Strong visual hook per slide
    - Focus question at bottom to re-engage wandering attention
    - Timer badge (2-5 min per concept)
    - Color-coded by topic area
    """
    system = (
        "You are the Slide Sorter Agent specialising in ADHD-friendly presentations. "
        "You know that ADHD learners need minimal text, one idea per slide, strong visuals, "
        "consistent layout, chunked information, and focus re-engagement hooks. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    objectives = pockets_data.get("learning_objectives", [])

    user = f"""
Topic: {topic}
Learning objectives: {json.dumps(objectives)}

Using the learning pockets below, create ADHD-friendly presentation slides.

ADHD slide rules:
- ONE concept per slide — split any pocket that has more than 3 key points into 2 slides
- Maximum 3 bullet points per slide
- Each bullet is maximum 8 words — use active, energetic verbs ("Find", "Make", "See")
- Include a visual hook: describe one clear image, icon, or diagram per slide
- Include a focus question at the bottom: one short question to catch wandering attention
- Suggest a timer (2–5 minutes — short chunks maintain focus)
- Assign a consistent color theme per related topic area so learners can track sections visually

Return a JSON array. Each element:
{{
  "index": <int starting at 1>,
  "title": "<max 5 words, action-oriented>",
  "bullets": ["<max 8 words each, active verb first>"],
  "visual_hint": "<describe one vivid, clear image or diagram>",
  "focus_question": "<max 10 words, direct question to re-engage attention>",
  "timer_minutes": <integer 2 to 5>,
  "color_theme": "<one of: teal | amber | rose | violet>"
}}

- First slide (index 1): title slide — title=topic, bullets=learning objectives (max 3), no focus_question
- Last slide: summary — title="What We Learned", bullets=key takeaways, no focus_question
- Total: 8–15 slides

POCKETS:
{pockets_str}
{_lang_instruction(lang)}"""
    return _parse_json(_ask(system, user, max_tokens=4096))


# ── Slide Sorter — Autism ──────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_autism_slides(pockets_data: dict, lang: str = "en") -> list[dict]:
    """
    Slide Sorter (Autism): converts pockets into structured, predictable slides.

    Autism slide principles applied:
    - Identical layout on every content slide
    - One idea per slide — never combine concepts
    - Heading format: "<N>. <Topic>: <Subtopic>"
    - Literal, explicit language — no idioms, metaphors, or ambiguity
    - Max 4 bullet details
    - Explicit "Why it matters" statement
    - Simple, unambiguous diagram description
    """
    system = (
        "You are the Slide Sorter Agent specialising in autism spectrum-friendly presentations. "
        "You know that autistic learners need identical layout structure on every slide, "
        "literal and explicit language, predictable organisation, and no ambiguity. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")

    user = f"""
Topic: {topic}

Using the learning pockets below, create slides for autism spectrum learners.

Autism slide rules:
- IDENTICAL layout structure on every content slide — predictability is essential
- ONE idea per slide — never combine two concepts on one slide
- Heading MUST follow this exact format: "<slide number>. <Topic>: <Subtopic>"
- Use ONLY literal, explicit language — absolutely NO idioms, metaphors, or figurative speech
- "what" field: one sentence saying exactly what this concept IS
- "details": maximum 4 factual sentences (each max 12 words, literal and complete)
- "why_it_matters": one sentence saying explicitly why this is relevant, no implications
- "visual_description": describe a simple, unambiguous image — no abstract art

Return a JSON array. Each element:
{{
  "index": <int starting at 1>,
  "heading": "<N. Topic: Subtopic — exact format>",
  "what": "<one sentence: this is exactly what X is>",
  "details": ["<literal factual sentence, max 12 words>"],
  "why_it_matters": "<one literal sentence about relevance>",
  "visual_description": "<describe a simple, unambiguous image or diagram>"
}}

- First slide (index 1): agenda — heading="1. Overview: Contents of This Presentation",
  what="This presentation covers the following topics.", details=[list each topic as "<N>. <topic>"],
  why_it_matters="Knowing what comes next helps you follow along.", visual_description="A numbered list on a white background."
- Last slide: summary — heading="N. Review: Key Points", what="These are the main things to remember.",
  details=[one-sentence summary per concept], why_it_matters="Reviewing helps you remember."
- Total: 8–15 slides

POCKETS:
{pockets_str}
{_lang_instruction(lang)}"""
    return _parse_json(_ask(system, user, max_tokens=4096))


# ── Transcriber Agent ──────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def transcribe_to_audio(pockets_data: dict, lang: str = "en") -> dict:
    """
    Transcriber Agent: converts pockets into an engaging, story-driven audio script.

    Designed for dyslexic learners and audio processors:
    - Narrative flow, not bullet-point reading
    - Everyday analogies for abstract concepts
    - Short sentences (max 15 words)
    - [PAUSE] markers for natural breathing room
    - Warm, encouraging teacher voice
    """
    system = (
        "You are the Transcriber Agent for ilm.io — you transform structured learning pockets "
        "into warm, engaging spoken narratives. You write the way a great teacher talks: "
        "with stories, analogies, natural rhythm, and gentle encouragement. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    summary = pockets_data.get("summary", "")

    user = f"""
Topic: {topic}
Summary: {summary}

Transform these learning pockets into an engaging audio narrative script.

Transcriber rules:
- Tell it like a story — create narrative flow and momentum, not a list
- Use natural transitions: "Now, here's something interesting...", "Think about it this way...", "Building on that..."
- Include everyday analogies for every abstract concept — make it relatable
- Keep sentences short: maximum 15 words per sentence
- Mark natural pauses with [PAUSE] — use them between major ideas and after key points
- Friendly, warm tone — like a trusted teacher who genuinely enjoys the topic
- Avoid jargon; if a technical term must appear, immediately explain it simply right after
- Target length: 3–6 minutes at natural speaking pace (~130 words per minute)

Return JSON:
{{
  "title": "<engaging, friendly title for the audio lesson>",
  "estimated_duration_minutes": <float, e.g. 4.5>,
  "word_count": <approximate total word count>,
  "intro": "<2-3 short sentences as a warm hook — spark curiosity>",
  "segments": [
    {{
      "concept": "<concept name matching pocket>",
      "narrative": "<flowing story about this concept — 100-200 words, multiple short paragraphs>",
      "transition": "<one short sentence bridging to the next concept>"
    }}
  ],
  "outro": "<2-3 encouraging sentences that summarise and motivate further study>"
}}

POCKETS:
{pockets_str}
{_lang_instruction(lang)}"""
    return _parse_json(_ask(system, user, max_tokens=4096))


# ── Slide Sorter — Dyslexia ────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_dyslexia_slides(pockets_data: dict, lang: str = "en") -> list[dict]:
    """Slide Sorter (Dyslexia): off-white bg, Arial 18pt, left-aligned, key phrase per slide."""
    system = (
        "You are the Slide Sorter Agent specialising in dyslexia-friendly presentations. "
        "Dyslexic learners need short sentences, left-aligned text, generous spacing, "
        "one idea per slide, highlighted key words, and no jargon. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    user = f"""
Topic: {topic}

Create dyslexia-friendly slides. Rules:
- ONE idea per slide. Max 3 bullets, each max 10 words, plain language.
- If a technical term must appear: "term = simple definition" in same bullet.
- key_phrase: single most important word or short phrase on this slide.
- reading_note: one warm reading tip ("Take it slow — read each line once").
- visual_hint: one simple unambiguous image.

Return JSON array. Each element:
{{
  "index": <int from 1>,
  "title": "<max 5 words>",
  "bullets": ["<max 10 words each>"],
  "key_phrase": "<1-3 words>",
  "visual_hint": "<simple image>",
  "reading_note": "<warm guidance>"
}}
First slide: title + what we learn. Last slide: summary. Total 8-15.

POCKETS:
{pockets_str}
""" + _lang_instruction(lang)
    return _parse_json(_ask(system, user, max_tokens=4096))


# ── Curious Critic — Worksheet ─────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def curious_critic_worksheet(pockets_data: dict, condition: str = "general", lang: str = "en") -> dict:
    """Curious Critic Agent (Worksheet): condition-adapted printable worksheet."""
    system = (
        "You are the Curious Critic Agent — specialist in accessible worksheets for neurodivergent learners. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    guides = {
        "adhd":    "Short questions (max 10 words). 3 mini-sections with a break prompt between. Checkboxes and fill-blanks. 1 bonus fun activity.",
        "dyslexia": "Word banks for fill-blanks. Sentence frames. Short questions (max 8 words). Simple matching activity.",
        "autism":  "Explicit instruction on every question. Example for every type. No open-ended ambiguity. Consistent format.",
        "general": "Balanced mix easy to hard. Clear instructions. Varied types.",
    }
    user = f"""
Topic: {topic} | Condition: {condition}
Guidance: {guides.get(condition, guides["general"])}

Return JSON exactly matching this structure:
{{
  "title": "<worksheet title>",
  "condition": "{condition}",
  "sections": [
    {{
      "title": "<e.g. Part A: Fill in the Blanks>",
      "instructions": "<one sentence instruction for this section>",
      "items": [
        {{"question": "<question shown to student, use _____ for blanks>", "answer": "<correct answer or model answer>"}},
        {{"question": "<question shown to student>", "answer": "<correct answer>"}}
      ]
    }}
  ]
}}
2-3 sections, 4-6 items each.
For fill-in-the-blank questions use _____ in the question field. Put the missing word in answer.
For short-answer questions write the full question and put a model answer in the answer field.
Difficulty increases across sections.

POCKETS:
{pockets_str}
""" + _lang_instruction(lang)
    return _parse_json(_ask(system, user, max_tokens=4000))


# ── Curious Critic — Quiz ──────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def curious_critic_quiz(pockets_data: dict, condition: str = "general", lang: str = "en") -> dict:
    """Curious Critic Agent (Quiz): condition-adapted interactive quiz."""
    system = (
        "You are the Curious Critic Agent — specialist in engaging low-stress quizzes for neurodivergent learners. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    guides = {
        "adhd":    "Max 10 questions. Short (<=10 words). Fun emojis in options. 1 bonus silly question.",
        "dyslexia": "Max 10 questions. <=8 words. Only 3 options (A/B/C). Hint for every question.",
        "autism":  "Strictly factual. No ambiguous phrasing. 4 clear options. Only one clearly correct.",
        "general": "8-12 questions. Mixed difficulty. 4 options. fun_fact after each.",
    }
    user = f"""
Topic: {topic} | Condition: {condition}
Guidance: {guides.get(condition, guides["general"])}

Return JSON:
{{
  "title": "<quiz title>",
  "condition": "{condition}",
  "intro_message": "<warm opener, max 20 words>",
  "questions": [
    {{
      "number": <int>,
      "question": "<question>",
      "options": ["<A>", "<B>", "<C>", "<D if applicable>"],
      "correct_index": <0-based int>,
      "hint": "<hint or empty>",
      "explanation": "<why correct, max 20 words>",
      "fun_fact": "<interesting fact or empty>",
      "difficulty": "<easy|medium|hard>"
    }}
  ],
  "completion_message": "<congrats, max 20 words>"
}}
Order easy to hard. Different concept per question.

POCKETS:
{pockets_str}
""" + _lang_instruction(lang)
    return _parse_json(_ask(system, user, max_tokens=3000))


# ── Student Observer ───────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def student_observer_analyze(students: list[dict], session_events: list[dict], topic: str = "") -> list[dict]:
    """Student Observer: enriches profiles with attention flags and coverage %."""
    system = (
        "You are the Student Observer Agent — you analyse student profiles and session data "
        "to flag who needs more attention and suggest teacher actions. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    user = f"""
Topic: {topic}
Students: {json.dumps(students, indent=2)}
Session events (content generated): {json.dumps(session_events, indent=2)}

For each student: is the session content right for their condition? Any red flags?

Return JSON array:
[{{
  "student_id": "<id>",
  "name": "<name>",
  "condition": "<condition>",
  "preferred_mode": "<visual|auditory|kinesthetic|reading-writing>",
  "content_coverage_pct": <0-100>,
  "needs_attention": <true|false>,
  "attention_reason": "<one sentence or empty>",
  "recommendation": "<one concrete teacher action, max 15 words>",
  "trend": "<improving|stable|declining>"
}}]
"""
    return _parse_json(_ask(system, user, max_tokens=1500))


# ── ilmuist ────────────────────────────────────────────────────────────────

def ilmuist_chat(
    message: str,
    history: list[dict],
    context: dict,
    role: str = "teacher",
    lang: str = "en",
) -> dict:
    """ilmuist: AI guide — teacher mode speaks Manglish, student mode speaks Gen Z."""
    app_page = context.get("app_page", "educator" if role == "teacher" else "student")
    app_ctx = context.get("app_context", "")
    app_guide = format_app_context(app_page, app_ctx)

    site_knowledge = (
        "ilm.io features:\n"
        "- Upload: PDF, DOCX, MP3, WAV, JPG, PNG\n"
        "- Reader Agent: extracts concept pockets from uploaded file\n"
        "- Orchestrator: coordinates agents, holds pocket cache\n"
        "- Slide Sorter ADHD: colour-coded PPTX, timer badges, focus hooks\n"
        "- Slide Sorter Autism: navy header, identical layout, literal language\n"
        "- Slide Sorter Dyslexia: Arial 18pt, off-white, key phrase box, reading notes\n"
        "- Transcriber: story-driven script + downloadable MP3\n"
        "- Curious Critic: worksheets + quizzes per condition (ADHD/Dyslexia/Autism/General)\n"
        "- Student Observer: identifies who needs more teacher attention\n"
        "- Languages: English, Bahasa Melayu, Mandarin, Tamil, Malaysian Rojak/Manglish\n"
        "- Powered by YTL ILMU AI nemo-super\n"
    )
    lang_extra = _lang_instruction(lang)
    ctx_parts = []
    if context.get("filename"):    ctx_parts.append(f"Uploaded file: {context['filename']}")
    if context.get("topic"):       ctx_parts.append(f"Topic: {context['topic']}")
    if context.get("summary"):     ctx_parts.append(f"Summary: {context['summary'][:600]}")
    if context.get("pocket_count"):ctx_parts.append(f"Concept pockets extracted: {context['pocket_count']}")
    if context.get("generated_outputs"):
        ctx_parts.append(f"Already generated this session: {', '.join(context['generated_outputs'])}")

    ctx_block = ("\nTeacher's current session:\n" + "\n".join(ctx_parts)) if ctx_parts else ""

    if role == "student":
        system = (
            "You are Ilm — Ilm's study buddy on ilm.io, powered by YTL ILMU AI (Malaysia). "
            "Talk like a warm Malaysian friend or kakak/abang — supportive, never lecturing. "
            "Natural Manglish is welcome: lah, ah, kan, boleh, aiyoo, confirm — don't force every sentence. "
            "Use Malaysian examples when they help (school, mamak, PT3/SPM, everyday life). "
            "Keep replies SHORT — 2-3 sentences max, 1-2 emojis max. "
            "Use bullet points (•) not long paragraphs. Max 3 bullets, ~10 words each. "
            "Match the student's language (English, BM, 中文, தமிழ், rojak/Manglish).\n"
            "You ALSO help navigate ilm.io (Controls, language, music, upload, mood, focus) — not only study.\n\n"
            + site_knowledge + "\n" + app_guide + ctx_block + lang_extra
        )
    else:
        voice = (
            "Natural Malaysian Manglish — colleague-to-colleague, still professional."
            if lang == "rojak"
            else "Warm but professional — like a trusted senior teacher or MOE inclusion advisor. "
            "Light Manglish (lah, kan) only if language is English or rojak."
        )
        system = (
            "You are Ilm Educator — the AI teaching guide on ilm.io, powered by YTL ILMU AI (Malaysia).\n\n"
            "YOUR ROLE:\n"
            "- Help teachers use ilm.io: uploads, Reader concept pockets, ADHD/Autism/Dyslexia slide outputs, "
            "audio transcriber scripts, Curious Critic worksheets & quizzes, Student Observer analytics.\n"
            "- Recommend which output format fits ADHD, dyslexia, autism, or mixed classes.\n"
            "- Give practical, evidence-informed neurodivergent-inclusive teaching tips for Malaysian classrooms "
            "(KSSM, SK/SMK, OKU, PdPR, PBS).\n"
            "- Use the teacher's session context (topic, pockets, what they already generated).\n\n"
            f"VOICE: {voice}\n"
            "- NOT a student study buddy. No Gen Z slang. No 'As an AI assistant'.\n"
            "- Short: max 4 sentences OR up to 4 bullet points (•), each under 14 words.\n"
            "- End with a clear next step when helpful.\n"
            "- Help teachers use the app UI (Controls, class panel, uploads, languages) — not only pedagogy.\n"
            f"{chat_lang_instruction(lang)}\n\n"
            + site_knowledge + "\n" + app_guide + ctx_block + lang_extra
        )

    messages = [{"role": "system", "content": system}]
    for m in history[-8:]:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": message})

    chat_temp = 0.55 if role == "teacher" else 0.65
    max_tok = 420 if role == "teacher" else 300
    resp = _client.chat.completions.create(
        model=_MODEL, max_tokens=max_tok, messages=messages, temperature=chat_temp,
    )
    reply = resp.choices[0].message.content or ""

    sugg_system = (
        "Output ONLY a JSON array of 2 short follow-up questions a Malaysian teacher might ask Ilm Educator. "
        "Each under 8 words. Examples: 'ADHD slide tips', 'Explain Student Observer', 'Worksheet for dyslexia'."
        if role == "teacher"
        else "Output ONLY a JSON array of 2 short follow-up questions. Each under 8 words."
    )
    try:
        sugg_resp = _client.chat.completions.create(
            model=_MODEL, max_tokens=100,
            messages=[
                {"role": "system", "content": sugg_system},
                {"role": "user",   "content": f"Teacher: {message}\nIlm Educator: {reply}" if role == "teacher" else f"Student: {message}\nIlm: {reply}"},
            ],
            temperature=0.4,
        )
        suggestions = _parse_json(sugg_resp.choices[0].message.content or "[]")
    except Exception:
        suggestions = []

    actions = []  # Chat must not offer system-control buttons

    return {"message": reply, "suggestions": suggestions, "actions": actions}


def _suggest_ui_actions(user_msg: str, reply: str, page: str, role: str) -> list[dict]:
    """0-2 optional tap buttons when the conversation implies a setting change (never auto-applied)."""
    valid = set(actions_for_role(page, role))
    if not valid:
        return []
    try:
        resp = _client.chat.completions.create(
            model=_MODEL,
            max_tokens=140,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Output ONLY a JSON array (0-2 items) of optional UI tap buttons for ilm.io. "
                        "The user must press a button — nothing runs automatically. "
                        f'Each: {{"id": "<allowed id>", "label": "<max 5 words>"}}. '
                        f"Allowed ids: {', '.join(sorted(valid))}. "
                        "Return [] if no button would help."
                    ),
                },
                {"role": "user", "content": f"User: {user_msg}\nIlm: {reply}"},
            ],
            temperature=0.2,
        )
        raw = _parse_json(resp.choices[0].message.content or "[]")
        if not isinstance(raw, list):
            return []
        out: list[dict] = []
        for item in raw:
            if isinstance(item, dict) and item.get("id") in valid:
                out.append({
                    "id": str(item["id"]),
                    "label": str(item.get("label", item["id"]))[:48],
                })
        return out[:2]
    except Exception:
        return []


# ── Student chat actions (functional Ilm — not free chat only) ─────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def student_chat_action(
    action: str,
    text: str,
    pockets: dict | None,
    lang: str = "en",
    mood: str = "okay",
) -> dict:
    """Structured actions for student chatbot: summarize, quiz, vocab, study_plan, focus_tip."""
    pocket_block = ""
    if pockets:
        pocket_block = json.dumps(
            {
                "topic": pockets.get("topic", ""),
                "summary": (pockets.get("summary") or "")[:800],
                "vocabulary": pockets.get("vocabulary", [])[:6],
                "concepts": [
                    p.get("concept", "")
                    for p in (pockets.get("pockets") or [])[:8]
                ],
            },
            ensure_ascii=False,
        )

    mood_note = {
        "good": "Student feels good — upbeat kawan energy.",
        "tired": "Student is tired — super short, gentle, no guilt.",
        "stressed": "Student is stressed — calm first, one tiny step only.",
    }.get(mood, "Talk like a supportive Malaysian friend.")

    templates = {
        "summarize": (
            "Create a quick revision summary from the material. "
            "Include voice_line: one casual Manglish sentence Ilm says before the list. "
            'Output ONLY JSON: {"voice_line": str, "title": str, "bullets": [str], "emoji": str}. '
            "Max 5 bullets, each max 14 words, simple words only."
        ),
        "quiz": (
            "Create a mini quiz from ONE important concept in the material. "
            "Include voice_line: playful challenge from Ilm (1 sentence). "
            'Output ONLY JSON: {"voice_line": str, "concept": str, "questions": [{"question": str, '
            '"options": [str,str,str], "correct_index": 0|1|2, "hint": str}]}. '
            "Exactly 3 questions, conversational wording."
        ),
        "vocab": (
            "Pick the 4-5 hardest terms and explain simply with a tiny example. "
            "Include voice_line: friendly intro (1 sentence). "
            'Output ONLY JSON: {"voice_line": str, "terms": [{"term": str, "definition": str, '
            '"example": str, "emoji": str}]}.'
        ),
        "study_plan": (
            "Build a realistic tonight study plan in 3 chunks with breaks. "
            "Include voice_line: encouraging opener (1 sentence, not robotic). "
            'Output ONLY JSON: {"voice_line": str, "steps": [{"title": str, "minutes": int, '
            '"task": str, "emoji": str}]}.'
        ),
        "focus_tip": (
            "Give ONE practical focus tip for studying this specific topic. "
            "Include voice_line: warm opener (1 sentence). "
            'Output ONLY JSON: {"voice_line": str, "tip": str, "why": str, "try_this": str, "emoji": str}.'
        ),
    }

    if action not in templates:
        return {
            "action": "error",
            "message": "Unknown action. Try Summarize, Quiz me, Vocab, Study plan, or Focus tip.",
            "payload": {},
        }

    system = (
        "You are Ilm — a Malaysian study buddy, NOT a formal tutor bot. "
        "voice_line must sound like a real friend texting (Manglish okay: lah, kan, eh). "
        "Structured fields stay clear and simple for ADHD/dyslexia readers. "
        f"{mood_note} Output ONLY valid JSON. "
        + _lang_instruction(lang)
    )
    user = (
        f"Action: {action}\n\n"
        f"Document excerpt:\n{text[:4500]}\n\n"
        f"Structured pockets:\n{pocket_block}\n\n"
        f"{templates[action]}"
    )

    raw = _ask(system, user, max_tokens=1200, temperature=0.78)
    try:
        payload = _parse_json(raw)
    except Exception:
        payload = {"raw": raw[:500]}

    fallback = {
        "summarize": "Okay here's the cheat sheet for you lah 📋",
        "quiz": "Jom try this quick quiz — no stress ah ❓",
        "vocab": "These words look scary but actually boleh je 🔤",
        "study_plan": "Tonight we take it slow slow, can one 📅",
        "focus_tip": "One tip that might help you focus today 🎯",
    }
    voice = payload.get("voice_line") if isinstance(payload, dict) else None
    friendly_msg = (voice.strip() if isinstance(voice, str) and voice.strip() else None) or fallback.get(action, "Done lah ✦")

    return {
        "action": action,
        "message": friendly_msg,
        "payload": payload,
    }


# ── Student Slide Sorter — ADHD ────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_student_adhd_slides(pockets_data: dict, lang: str = "en") -> list[dict]:
    """Slide Sorter (Student ADHD): punchy, colour-coded, bionic reading applied at render."""
    system = (
        "You are the Slide Sorter Agent for STUDENT learners with ADHD. "
        "Create slides that feel exciting, focused, and easy to follow. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    user = f"""
Topic: {topic}

Rules:
- ONE clear idea per slide. Max 3 bullets, each max 10 words.
- fun_fact: a surprising memorable fact related to this slide concept.
- mind_map_hint: simple chain "Topic → Key Idea → Detail" (max 8 words total).
- focus_question: one short curiosity-sparking question ending with "?".
- timer_minutes: 3-5.
- color_theme: rotate through "teal", "amber", "rose", "violet".
- visual_hint: concrete image that makes the concept stick.

Return JSON array 8-14 slides. Each element:
{{
  "index": <int>,
  "title": "<punchy max-5-word title>",
  "bullets": ["<max 10 words>"],
  "fun_fact": "Did you know…?",
  "mind_map_hint": "<Topic → Idea → Detail>",
  "visual_hint": "<image description>",
  "focus_question": "<curious question?>",
  "timer_minutes": <3-5>,
  "color_theme": "<teal|amber|rose|violet>"
}}
Last slide must be a summary / key-takeaways slide.
POCKETS:
{pockets_str}
""" + _lang_instruction(lang)
    return _parse_json(_ask(system, user, max_tokens=4096))


# ── Student Slide Sorter — Autism ──────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_student_autism_slides(pockets_data: dict, lang: str = "en") -> list[dict]:
    """Slide Sorter (Student Autism): identical layout, literal language, no ambiguity."""
    system = (
        "You are the Slide Sorter Agent for STUDENT learners on the Autism Spectrum. "
        "Zero surprises: identical layout every slide, literal language, "
        "no idioms, no metaphors, no ambiguity. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    user = f"""
Topic: {topic}

Rules:
- Identical structure every slide: heading, what, details (max 3), why_it_matters, visual_description.
- No idioms or metaphors — literal and direct only. Max 12 words per sentence.
- One idea per slide. why_it_matters starts "This matters because…"
- visual_description: plain concrete image (no abstract art).

Return JSON array 8-14 slides:
{{
  "index": <int>,
  "heading": "<literal clear heading>",
  "what": "<one clear sentence stating what this is>",
  "details": ["<complete sentence>", "<complete sentence>"],
  "why_it_matters": "This matters because…",
  "visual_description": "<plain image description>"
}}
Last slide heading must be "What We Learned Today".
POCKETS:
{pockets_str}
""" + _lang_instruction(lang)
    return _parse_json(_ask(system, user, max_tokens=4096))


# ── Visualizer — Mind Map ──────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_visual_mindmap(pockets_data: dict, lang: str = "en") -> dict:
    """Visualizer Agent: structured mind map + fun facts for interactive display."""
    system = (
        "You are the Visualizer Agent for ilm.io. "
        "Create mind maps that help neurodivergent students see how concepts connect. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    user = f"""
Topic: {topic}

Create a visual mind map. Rules:
- 4-7 branches = main themes from the pockets.
- Each branch: 2-4 subnodes (key facts, examples, concepts). Max 8 words per subnode.
- Each branch: one emoji + one color ("teal","amber","rose","violet","sage","dust").
- fun_facts: 4-6 surprising memorable facts from the material. Each starts with "Did you know".
- summary: 2-3 plain-language sentences suitable for a student.

Return JSON:
{{
  "topic": "<central concept>",
  "summary": "<2-3 plain-language sentences>",
  "branches": [
    {{
      "label": "<branch name>",
      "emoji": "<emoji>",
      "color": "<color>",
      "subnodes": ["<fact/detail max 8 words>"]
    }}
  ],
  "fun_facts": ["Did you know…?"]
}}
POCKETS:
{pockets_str}
""" + _lang_instruction(lang)
    return _parse_json(_ask(system, user, max_tokens=2000))


# ── Examiner — Student Worksheet ──────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def generate_examiner_worksheet(pockets_data: dict, lang: str = "en") -> dict:
    """Examiner Agent: self-study worksheet with varied activity types for students."""
    system = (
        "You are the Examiner Agent for ilm.io — a student-friendly worksheet specialist. "
        "Create engaging self-directed worksheets for neurodivergent learners. "
        "Output ONLY valid JSON — no prose outside the JSON block."
    )
    pockets_str = json.dumps(pockets_data.get("pockets", []), indent=2)
    topic = pockets_data.get("topic", "Topic")
    user = f"""
Topic: {topic}

Create a student self-study worksheet with these sections:
1. fill_blanks: 3 fill-in-the-blank sentences (include word_bank at top).
2. true_false: 3 true/false questions with answer + explanation.
3. short_answer: 2 open reflection prompts (1-2 sentences expected).
4. match_it: 3 term ↔ definition matching pairs.
5. challenge: 1 creative or extension activity.

Return JSON:
{{
  "title": "<topic> — Let's See What You Know!",
  "instructions": "<warm encouraging single sentence>",
  "word_bank": ["word1", "word2"],
  "fill_blanks": [{{"sentence": "The ___ does…", "answer": "word", "word_bank_word": "word"}}],
  "true_false": [{{"statement": "…", "answer": true, "explanation": "…"}}],
  "short_answer": [{{"prompt": "In your own words…", "hint": "Think about…", "model_answer": "<1-2 sentence model answer>"}}],
  "match_it": [{{"term": "…", "definition": "…"}}],
  "challenge": {{"title": "Creative Challenge", "prompt": "…"}}
}}
POCKETS:
{pockets_str}
""" + _lang_instruction(lang)
    return _parse_json(_ask(system, user, max_tokens=4000))
