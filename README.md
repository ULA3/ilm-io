# ilm.io — AI Teaching Assistant for Neurodivergent Learners

An AI-powered platform that transforms uploaded study materials (PDF, audio, images) into accessible formats — slides, audiobooks, visual summaries, worksheets — optimised for ADHD, dyslexia, autism spectrum, and general neurodivergent learners.

An inclusive learning platform for neurodivergent students and the educators who support them.

```
Frontend (Next.js 15)  →  Backend (FastAPI)  →  LLM (YTL ILMU AI / nemo-super)
                                             →  TTS (ElevenLabs / OpenAI)
                                             →  OCR (Tesseract / Whisper)
                                             →  Database & Storage (Supabase)
```

---

## Project structure

```
FinTech_Hackathon/
├── ai-teaching-assistant/   ← Next.js 15 frontend
│   ├── app/
│   │   ├── page.tsx         ← Landing — Student / Educator role select
│   │   ├── student/         ← Student dashboard
│   │   └── educator/        ← Educator dashboard
│   ├── lib/api.ts           ← Typed API client (calls FastAPI)
│   └── .env.local           ← NEXT_PUBLIC_API_URL
└── backend/                 ← FastAPI backend
    ├── main.py
    ├── config.py
    ├── .env.example         ← Copy to .env and fill in keys
    ├── models/schemas.py
    ├── services/
    │   ├── llm_client.py          ← YTL ILMU AI (nemo-super) — all LLM calls
    │   ├── ai_service.py          ← prompts + chat (uses llm_client)
    │   ├── document_processor.py← PDF / image / audio / DOCX extraction
    │   ├── tts_service.py       ← ElevenLabs + OpenAI TTS fallback
    │   └── supabase_client.py   ← DB queries + file storage
    ├── routers/
    │   ├── upload.py        ← POST /api/upload
    │   ├── generate.py      ← POST /api/generate/{kind}
    │   ├── chat.py          ← POST /api/chat
    │   ├── analytics.py     ← POST /api/analytics/event
    │   ├── students.py      ← GET  /api/students
    │   └── reports.py       ← GET/POST /api/reports
    └── supabase/migrations/001_initial.sql
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Python | 3.11+ | [python.org](https://python.org) |
| Tesseract OCR | any | `winget install UB-Mannheim.TesseractOCR` (Windows) |
| pip | latest | comes with Python |

---

## Step 1 — API keys

You need three free accounts:

### YTL ILMU AI (LLM — required)
1. Go to [ilmu.ai](https://ilmu.ai) and create an API key
2. Set in `backend/.env`:
   - `ILMU_API_KEY`
   - `ILMU_BASE_URL` (OpenAI-compatible endpoint)
   - `ILMU_MODEL=nemo-super`

### Supabase (database + file storage — free tier)
1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Once created: **Project Settings → API**
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **service_role** secret (the long JWT starting with `eyJ`) → `SUPABASE_SERVICE_KEY`
3. In the Supabase dashboard go to **SQL Editor** and paste + run the contents of `backend/supabase/migrations/001_initial.sql`
4. Go to **Storage → New bucket** → name it `ilmio-uploads` → enable **Public bucket**

### ElevenLabs (TTS audiobooks — free tier: 10k chars/month)
1. Go to [elevenlabs.io](https://elevenlabs.io) → Sign up free
2. **Profile → API Keys** → Create key → copy it

### OpenAI (Whisper transcription for audio uploads — pay-per-use, ~$0.006/min)
- Already configured if you have a key. Only required for MP3/WAV uploads.
- Skip if you don't upload audio files — the rest works without it.

---

## Step 2 — Backend setup

```powershell
cd C:\FinTech_Hackathon\backend

# Copy env template and fill in your keys
Copy-Item .env.example .env
```

Open `.env` and set:
```env
ILMU_API_KEY=...                # required
ILMU_BASE_URL=https://api.ytlailabs.tech/v1
ILMU_MODEL=nemo-super
OPENAI_API_KEY=sk-...         # required only for audio file uploads
ELEVENLABS_API_KEY=sk_...     # required for audiobook generation
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # must be service_role, not anon
SUPABASE_STORAGE_BUCKET=ilmio-uploads
```

```powershell
# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be live at **http://localhost:8000**
Interactive docs at **http://localhost:8000/api/docs**

---

## Step 3 — Frontend setup

```powershell
cd C:\FinTech_Hackathon\ai-teaching-assistant

# Install dependencies (already done if you ran this before)
npm install

# Start the dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

`.env.local` already points the frontend at the backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running both at once (two terminals)

**Terminal 1 — Backend:**
```powershell
cd C:\FinTech_Hackathon\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```powershell
cd C:\FinTech_Hackathon\ai-teaching-assistant
npm run dev
```

---

## How it works — user flow

```
1. Open http://localhost:3000
2. Choose role: Student or Educator
3. Upload a file (PDF, image, audio, DOCX)
   └── Backend extracts text via PyMuPDF / Tesseract / Whisper
4. Click a generate button (e.g. "Slides", "Worksheet")
   └── FastAPI calls YTL ILMU AI (nemo-super) with structured agent prompts
   └── Result is saved to Supabase
   └── Frontend renders the output with a Download button
5. Open the AI chatbot (bottom-right button)
   └── Chat about the uploaded material in plain, simple language
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Upload a file — returns `file_id` + extracted text |
| POST | `/api/generate/slides` | Generate slide deck (PPTX) |
| POST | `/api/generate/audiobook` | Generate MP3 audiobook |
| POST | `/api/generate/visual-summary` | Generate concept cards (PDF) |
| POST | `/api/generate/worksheet` | Generate adaptive worksheet (PDF) |
| POST | `/api/generate/simplified-text` | Plain-language rewrite (PDF) |
| POST | `/api/generate/educator/{kind}` | Educator-specific outputs |
| POST | `/api/chat` | AI chatbot message |
| GET | `/api/students` | List student profiles |
| POST | `/api/analytics/event` | Log engagement event |
| GET | `/api/analytics/heatmap` | Topic difficulty heatmap |
| GET | `/api/reports` | List weekly AI reports |
| POST | `/api/reports/generate` | Trigger a new weekly report |
| GET | `/api/health` | Health check |

Full interactive docs: **http://localhost:8000/api/docs**

---

## AI pipeline — services used

| Service | Purpose | Cost |
|---|---|---|
| **YTL ILMU AI** (nemo-super) | All text generation — slides, worksheets, insights, chatbot, financial literacy | API key via ilmu.ai |
| **ElevenLabs** | Audiobook TTS — natural, calm voice | 10,000 chars/month free |
| **OpenAI Whisper** | Transcribe uploaded MP3/WAV → text | pay-per-use |
| **OpenAI TTS** | Audiobook fallback if ElevenLabs unavailable | ~$0.015/1k chars |
| **PyMuPDF** | PDF text extraction + page rendering | free (local) |
| **Tesseract** | OCR for image-only PDFs and photos | free (local) |
| **Supabase** | PostgreSQL DB + file storage + auth | free tier |

---

## AI Tools Used

### 1. YTL ILMU AI — `nemo-super`

**What it does:**
The primary large language model powering every AI feature in ilm.io. Handles all structured text generation: slides, worksheets, visual summaries, simplified text, financial literacy explainers, educator content packs, the multi-agent pipeline (Reader → Orchestrator → SlideSorter / Transcriber / Examiner), and the ilmuist chatbot.

**Why it was chosen:**
- OpenAI-compatible API (drop-in with the `openai` Python SDK)
- Natively multilingual: English, Bahasa Melayu, Mandarin Chinese (Simplified), Tamil — critical for Malaysia's multi-ethnic classroom context
- Trained with Malaysian context: RM, DuitNow, EPF/KWSP, zakat, takaful — makes financial literacy outputs locally relevant
- Hosted in Malaysia → lower latency for local users and data residency alignment

**How it's used:**
All LLM calls go through `backend/services/llm_client.py` which wraps the OpenAI client with `base_url=ilmu.ai` and `model=nemo-super`. Calls are retried up to 3× with exponential backoff (via `tenacity`). Heavy generation runs in a thread pool to avoid blocking FastAPI's async event loop.

**Known limitations:**
- Context window limits mean documents > 5,000–6,000 characters are silently truncated before being sent to the model; the API flags this with `truncated: true`
- JSON-format output can fail to parse on rare occasions; the retry decorator handles most cases but complex worksheets may need a second attempt
- Rate limits apply depending on API tier

---

### 2. ElevenLabs

**What it does:**
Converts extracted document text into a natural-sounding MP3 audiobook. Used in the "Generate Audiobook" feature for students who benefit from audio-based learning (dyslexia-friendly, ADHD support).

**Why it was chosen:**
- High-quality, human-sounding voice synthesis (significantly more natural than OpenAI TTS for longer passages)
- Simple REST API with Python SDK
- Free tier (10,000 characters/month) is sufficient for classroom pilots

**How it's used:**
`backend/services/tts_service.py` calls ElevenLabs with the first 3,000 characters of the extracted text. The resulting MP3 is stored in Supabase Storage and served via a download URL.

**Known limitations:**
- Free tier limit of 10,000 chars/month resets monthly; heavy use will exhaust it quickly
- No multilingual voice support in the free tier (English voice only)
- Automatically falls back to OpenAI TTS if the ElevenLabs key is missing or the call fails

---

### 3. OpenAI Whisper

**What it does:**
Transcribes uploaded audio files (MP3, WAV) into text. The transcript is then treated like any other document — users can generate slides, worksheets, or summaries from a recorded lecture or podcast.

**Why it was chosen:**
- Best-in-class open speech recognition accuracy across accents and noise conditions
- Widely supported via OpenAI's API
- Pay-per-use keeps costs low for classroom-scale use

**How it's used:**
`backend/services/document_processor.py` detects audio file uploads and sends them to `openai.audio.transcriptions.create(model="whisper-1")`. The returned transcript is stored alongside the file metadata.

**Known limitations:**
- Requires an `OPENAI_API_KEY` — the app functions fully without it as long as users don't upload audio files
- Accuracy drops on heavily accented or code-switched Malay–English speech
- Long audio files (> 25 MB) must be split before upload

---

### 4. OpenAI TTS (fallback)

**What it does:**
Generates audiobook MP3s when ElevenLabs is unavailable (missing API key or quota exceeded). Acts as a silent fallback so the audiobook feature never hard-fails.

**Why it was chosen:**
- Same API key as Whisper — zero additional credential setup
- Reliable uptime with pay-per-use pricing
- Acceptable quality for short educational excerpts

**Known limitations:**
- Slightly more robotic than ElevenLabs for longer passages
- ~$0.015 per 1,000 characters — more expensive than ElevenLabs at scale

---

### 5. PyMuPDF (`fitz`)

**What it does:**
Extracts text from PDF uploads. Handles multi-page PDFs, preserves paragraph structure, and renders pages to images for OCR fallback when a PDF contains scanned pages.

**Why it was chosen:**
- Fastest Python PDF library for text extraction
- Handles complex layouts (columns, tables) better than `pdfplumber` alone
- Provides pixel-level page rendering needed to feed scanned pages to Tesseract

**How it's used:**
`backend/services/document_processor.py` opens the PDF with `fitz.open()`, iterates pages, extracts text blocks, and joins them. If a page yields no text (scanned), it renders the page as a PNG and passes it to Tesseract.

**Known limitations:**
- Cannot extract text from password-protected PDFs
- Table extraction is layout-heuristic — complex multi-column tables may merge incorrectly
- Very large PDFs (> 50 pages) are processed in full, which can slow the upload step

---

### 6. Tesseract OCR

**What it does:**
Performs optical character recognition on image-only PDFs and direct image uploads (JPG, PNG). Extracts printed text from scanned worksheets, textbook photos, or whiteboard images.

**Why it was chosen:**
- Best open-source OCR engine, actively maintained by Google
- Supports Malay, Chinese (Simplified), and Tamil character sets alongside English
- Free, runs locally — no API calls, no data sent to third parties

**How it's used:**
`backend/services/document_processor.py` calls `pytesseract.image_to_string()` on PIL images. For PDFs, PyMuPDF renders each page to a high-resolution PNG first, then Tesseract reads it.

**Known limitations:**
- Accuracy degrades on handwritten text, decorative fonts, or low-contrast scans
- Must be installed separately (`winget install UB-Mannheim.TesseractOCR` on Windows); the backend will error on image uploads if it's not present
- Slower than cloud OCR services — large image PDFs can take several seconds per page

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│                                                                 │
│  Landing Page → Role Select (Student / Educator)                │
│        │                                                        │
│  ┌─────▼──────────┐        ┌──────────────────────┐            │
│  │ Student        │        │ Educator Dashboard   │            │
│  │ Dashboard      │        │ - Upload             │            │
│  │ - Upload       │        │ - Generate per       │            │
│  │ - Generate     │        │   condition (ADHD /  │            │
│  │ - Chatbot(Ilm) │        │   Dyslexia / Autism) │            │
│  │ - Mood tracker │        │ - Student profiles   │            │
│  └─────┬──────────┘        │ - Analytics          │            │
│        │                   └──────────┬───────────┘            │
└────────┼──────────────────────────────┼────────────────────────┘
         │  HTTP (Next.js proxy /api/*) │
         ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (port 8000)                   │
│                                                                 │
│  POST /api/upload     → document_processor.py                   │
│                         ├── PyMuPDF (PDF text)                  │
│                         ├── Tesseract (OCR for images/scanned)  │
│                         └── OpenAI Whisper (audio → text)       │
│                                                                 │
│  POST /api/generate/* → ai_service.py                           │
│                         └── YTL ILMU AI nemo-super (LLM)        │
│                                                                 │
│  POST /api/agents/*   → agent_service.py                        │
│                         └── Multi-agent pipeline:               │
│                             Reader → Orchestrator →             │
│                             SlideSorter / Transcriber /         │
│                             Visualizer / Examiner               │
│                                                                 │
│  POST /api/chat       → ai_service.chat_response()              │
│                         └── Ilm personality (YTL ILMU AI)       │
│                                                                 │
│  POST /api/generate/audiobook → tts_service.py                  │
│                                  ├── ElevenLabs (primary)       │
│                                  └── OpenAI TTS (fallback)      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (managed cloud)                    │
│                                                                 │
│  PostgreSQL DB                                                  │
│  ├── uploads          (file metadata, extracted text)           │
│  ├── chat_sessions    (conversation history)                    │
│  ├── analytics_events (engagement tracking)                     │
│  └── weekly_reports   (AI-generated educator summaries)         │
│                                                                 │
│  Storage Buckets                                                │
│  ├── ilmio-uploads/   (original uploaded files)                 │
│  └── artifacts/       (generated PPTX, PDF, MP3 files)          │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow for a generation request:**
1. User uploads file → `POST /api/upload` → PyMuPDF/Tesseract/Whisper extracts text → stored in Supabase + in-memory cache → returns `file_id`
2. User clicks Generate → `POST /api/generate/{kind}` → text fetched from cache (or Supabase fallback) → YTL ILMU AI generates structured content → artifact saved to Supabase Storage → `download_url` returned
3. User clicks Download → `GET /api/download/{job_id}` → served from in-memory cache (or recovered from Supabase Storage if server restarted)

---

## Troubleshooting

**`ILMU_API_KEY` missing or LLM errors**
→ Copy `backend/.env.example` to `.env` and set `ILMU_API_KEY`, `ILMU_BASE_URL`, `ILMU_MODEL`.

**Upload returns 500**
→ Check Tesseract is installed: `tesseract --version` in a terminal.
→ For audio uploads, ensure `OPENAI_API_KEY` is set.

**Supabase 401 errors**
→ You're using the anon/publishable key. Use the **service_role** key instead (long JWT starting with `eyJ`). Found at Supabase → Project Settings → API → `service_role`.

**CORS errors in browser**
→ Confirm the backend is running on port 8000 and `NEXT_PUBLIC_API_URL=http://localhost:8000` is set in `ai-teaching-assistant/.env.local`.

**ElevenLabs audiobook fails**
→ Free tier is 10k chars/month. Either upgrade or the backend falls back to OpenAI TTS automatically if `OPENAI_API_KEY` is set.
