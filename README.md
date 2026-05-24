# ilm.io — AI Teaching Assistant for Neurodivergent Learners

An inclusive learning platform that transforms uploaded study materials (PDF, images, audio, DOCX) into accessible formats — slides, audiobooks, visual summaries, worksheets — tailored for ADHD, dyslexia, autism spectrum, and other neurodivergent learners.

**Source code repository:** GitHub / GitLab monorepo with frontend, backend, API routes, database migrations, and configuration templates (no secrets committed).

---

## Table of contents

1. [Technology stack](#technology-stack)
2. [Project structure](#project-structure)
3. [How the system is built](#how-the-system-is-built)
4. [Setup](#setup)
5. [Configuration files](#configuration-files)
6. [API endpoints](#api-endpoints)
7. [Database schema](#database-schema)
8. [AI tools used](#ai-tools-used)
9. [Troubleshooting](#troubleshooting)

---

## Technology stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15, React, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| **AI / LLM** | YTL ILMU AI (`nemo-super`, GLM-based, OpenAI-compatible API) |
| **Voice (TTS)** | ElevenLabs REST API (primary), OpenAI TTS (fallback) |
| **Speech-to-text** | OpenAI Whisper (audio uploads) |
| **Document processing** | PyMuPDF, Tesseract OCR, python-docx |
| **Database & storage** | Supabase (PostgreSQL + object storage) |

---

## Project structure

```
FinTech_Hackathon/
├── ai-teaching-assistant/          # Frontend (Next.js 15)
│   ├── app/
│   │   ├── page.tsx                # Landing — role select (Student / Educator)
│   │   ├── student/page.tsx        # Student dashboard
│   │   ├── educator/page.tsx       # Educator dashboard
│   │   ├── api/[...path]/route.ts  # Proxy to FastAPI (avoids CORS/timeouts)
│   │   └── components/             # UI: chat, sidebar, landing, accessibility
│   ├── lib/
│   │   ├── api.ts                  # Typed API client
│   │   ├── ui-strings-*.ts         # i18n (EN, BM, zh, ta)
│   │   └── educator-class.ts       # Whole-class vs per-student modes
│   ├── next.config.ts
│   ├── package.json
│   └── .env.example                # Copy to .env.local for frontend
│
└── backend/                        # Backend (FastAPI)
    ├── main.py                     # App entry, CORS, router mount
    ├── config.py                   # Settings from environment
    ├── .env.example                # Backend env template (copy to .env)
    ├── requirements.txt
    ├── models/schemas.py           # Pydantic request/response models
    ├── routers/
    │   ├── upload.py               # POST /api/upload
    │   ├── generate.py             # POST /api/generate/{kind}
    │   ├── agents.py               # POST /api/agents/* (multi-agent pipeline)
    │   ├── chat.py                 # POST /api/chat
    │   ├── students.py             # GET  /api/students
    │   ├── analytics.py            # POST /api/analytics/event
    │   └── reports.py              # GET/POST /api/reports
    ├── services/
    │   ├── llm_client.py           # YTL ILMU AI wrapper
    │   ├── ai_service.py           # Prompts + generation
    │   ├── agent_service.py        # Reader → Orchestrator → specialists
    │   ├── document_processor.py   # PDF / OCR / Whisper extraction
    │   ├── tts_service.py          # ElevenLabs + OpenAI TTS
    │   └── supabase_client.py      # DB + storage
    └── supabase/migrations/
        └── 001_initial.sql         # PostgreSQL schema + seed data
```

---

## How the system is built

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Next.js, port 3000)                 │
│  Landing → Student / Educator dashboards → Upload → Generate    │
│  Ilm chatbot (advisory only — does not change app settings)      │
└────────────────────────────┬────────────────────────────────────┘
                             │  /api/* proxy
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI backend (port 8000)                      │
│                                                                  │
│  upload        → PyMuPDF / Tesseract / Whisper → extracted text │
│  generate/*    → ILMU nemo-super → PPTX / PDF / MP3 artifacts   │
│  agents/*      → Multi-agent pipeline (slides, transcribe, etc.)│
│  chat          → ILMU with Ilm personality                        │
│  audiobook/TTS → ElevenLabs REST → OpenAI fallback              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                  │
│  PostgreSQL: uploads, generations, students, engagement, chat   │
│  Storage:    ilmio-uploads (originals + generated artifacts)    │
└─────────────────────────────────────────────────────────────────┘
```

**Typical flow**

1. User uploads a file → text is extracted and cached → `file_id` returned.
2. User picks a format (slides, worksheet, audiobook, …) → backend calls ILMU with structured prompts → artifact saved to Supabase → download URL returned.
3. Audiobook / transcribe paths call `tts_service.py`, which posts to ElevenLabs `/v1/text-to-speech/:voice_id` with `model_id` and `output_format`, then falls back to OpenAI TTS if needed.

---

## Setup

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18+ | Frontend |
| Python | 3.11+ | Backend |
| Tesseract OCR | any | Required for image/scanned PDF uploads |

### 1. Clone and configure secrets

Copy env templates — **never commit real keys**:

```powershell
copy backend\.env.example backend\.env
copy ai-teaching-assistant\.env.example ai-teaching-assistant\.env.local
```

Fill in `backend/.env` (see [Configuration files](#configuration-files)).

**Accounts needed**

| Service | Purpose | Sign up |
|---|---|---|
| YTL ILMU AI | All text generation & chat | [ilmu.ai](https://ilmu.ai) |
| Supabase | Database + file storage | [supabase.com](https://supabase.com) |
| ElevenLabs | Audiobook voice (10k chars/mo free) | [elevenlabs.io](https://elevenlabs.io) |
| OpenAI | Whisper (audio upload) + TTS fallback | [platform.openai.com](https://platform.openai.com) |

**Supabase one-time setup**

1. Create a project → **Settings → API** → copy URL and **service_role** key.
2. Run `backend/supabase/migrations/001_initial.sql` in the SQL Editor.
3. Create a public storage bucket named `ilmio-uploads`.

### 2. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/api/docs  

### 3. Frontend

```powershell
cd ai-teaching-assistant
npm install
npm run dev
```

- App: http://localhost:3000  

### 4. Run both (two terminals)

**Terminal 1 — backend:** `cd backend && .\venv\Scripts\Activate.ps1 && uvicorn main:app --reload --port 8000`  
**Terminal 2 — frontend:** `cd ai-teaching-assistant && npm run dev`

---

## Configuration files

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `ILMU_API_KEY` | Yes | YTL ILMU AI API key |
| `ILMU_BASE_URL` | Yes | Default `https://api.ilmu.ai/v1` |
| `ILMU_MODEL` | Yes | Default `nemo-super` |
| `SUPABASE_URL` | Yes | Project URL from Supabase dashboard |
| `SUPABASE_SERVICE_KEY` | Yes | **service_role** key (not anon) |
| `SUPABASE_STORAGE_BUCKET` | Yes | Default `ilmio-uploads` |
| `ELEVENLABS_API_KEY` | For TTS | Primary audiobook provider |
| `ELEVENLABS_VOICE_ID` | Optional | Default premade voice `EXAVITQu4vr4xnSDxMaL` |
| `ELEVENLABS_MODEL_ID` | Optional | Default `eleven_flash_v2_5` (efficient on free tier) |
| `ELEVENLABS_OUTPUT_FORMAT` | Optional | Default `mp3_44100_128` |
| `OPENAI_API_KEY` | Optional | Whisper + TTS fallback |
| `FRONTEND_URL` | Optional | Default `http://localhost:3000` |

### `ai-teaching-assistant/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Leave empty to use built-in `/api` proxy, or set `http://localhost:8000` |
| `BACKEND_URL` | Used by the Next.js API proxy (default `http://localhost:8000`) |

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload file → `file_id` + extracted text |
| POST | `/api/generate/slides` | Slide deck (PPTX) |
| POST | `/api/generate/audiobook` | MP3 audiobook (ElevenLabs → OpenAI) |
| POST | `/api/generate/visual-summary` | Concept cards (PDF) |
| POST | `/api/generate/worksheet` | Adaptive worksheet (PDF) |
| POST | `/api/generate/simplified-text` | Plain-language rewrite (PDF) |
| POST | `/api/generate/educator/{kind}` | Educator-specific outputs |
| POST | `/api/agents/{pipeline}` | Multi-agent generation (slides, transcribe, …) |
| POST | `/api/chat` | Ilm chatbot |
| GET | `/api/students` | Student profiles |
| POST | `/api/analytics/event` | Engagement tracking |
| GET | `/api/reports` | Weekly AI reports |
| GET | `/api/download/{job_id}` | Download generated artifact |

Full interactive reference: http://localhost:8000/api/docs

---

## Database schema

Defined in `backend/supabase/migrations/001_initial.sql`.

| Table | Purpose |
|---|---|
| `uploads` | Uploaded files — filename, type, extracted text, storage path |
| `generations` | Generated artifacts linked to uploads (slides, audiobook, …) |
| `students` | Demo student profiles (condition, learning style, insights) |
| `engagement_events` | Session analytics (slide views, quiz answers, scores) |
| `chat_sessions` | Chat history per session |
| `weekly_reports` | AI-generated educator summaries |

Extensions: `uuid-ossp`, `pg_trgm` (fuzzy search).

---

## AI tools used

### Ideas, research & statistics

| Tool | Role |
|---|---|
| **ChatGPT** | Brainstorming product features, UX flows, and neurodiversity-informed design patterns |
| **Gemini** | Cross-checking Malaysian education context, multilingual content, and competitor research |
| **Grok** | Rapid iteration on naming, taglines, and hackathon pitch framing |

### Coding & implementation

| Tool | Role |
|---|---|
| **Claude Code** | Backend services, agent pipeline, document processing, API design |
| **Cursor** | Frontend components, i18n, educator/student dashboards, debugging, integration |

### AI engine running the site

| Tool | Role |
|---|---|
| **YTL ILMU AI (GLM / `nemo-super`)** | Powers all live generation: slides, worksheets, visual summaries, simplified text, financial literacy content, multi-agent pipeline, and the Ilm chatbot. Implemented via `backend/services/llm_client.py` (OpenAI-compatible client, retries, thread-pool for long jobs). |

### Voice generation

| Tool | Role |
|---|---|
| **ElevenLabs** | Primary TTS for audiobooks and agent transcribe output. Calls `POST /v1/text-to-speech/:voice_id` with configurable `model_id` and `output_format` in `backend/services/tts_service.py`. |

### Supporting AI / ML (not user-facing branding)

| Tool | Role |
|---|---|
| **OpenAI Whisper** | Transcribes uploaded MP3/WAV lectures |
| **OpenAI TTS** | Automatic fallback when ElevenLabs is unavailable |
| **Tesseract OCR** | Local OCR for scanned PDFs and images (no cloud API) |

---

## Troubleshooting

**LLM errors / missing key**  
Copy `backend/.env.example` → `.env` and set `ILMU_API_KEY`, `ILMU_BASE_URL`, `ILMU_MODEL`.

**Upload returns 500 on images**  
Install Tesseract: `winget install UB-Mannheim.TesseractOCR` then verify with `tesseract --version`.

**Supabase 401**  
Use the **service_role** key from Supabase → Settings → API, not the anon/publishable key.

**CORS / generation timeout in browser**  
Keep the frontend proxy enabled (`NEXT_PUBLIC_API_URL` empty, `BACKEND_URL=http://localhost:8000` in `.env.local`).

**ElevenLabs always falls back to OpenAI**

The integration is working if you see `ElevenLabs TTS ok` in backend logs. Common failure reasons:

1. **`detected_unusual_activity` (HTTP 401)** — ElevenLabs has disabled free-tier access for the account (often triggered by VPN/proxy or multiple free accounts). Fix: disable VPN, log in at [elevenlabs.io](https://elevenlabs.io) to verify account status, or upgrade to a paid plan. OpenAI TTS will be used meanwhile if `OPENAI_API_KEY` is set.
2. **Quota exceeded** — Free tier is ~10,000 characters/month. Wait for reset or upgrade.
3. **Invalid voice ID** — Use a voice from your ElevenLabs account or the default `EXAVITQu4vr4xnSDxMaL`.

Check backend console for lines like `ElevenLabs TTS failed: …` — the message explains why fallback occurred.

**Audio upload fails**  
Set `OPENAI_API_KEY` for Whisper transcription.

---

## License

Built for the FinTech Hackathon. See repository for license details.
