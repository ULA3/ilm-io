# ilm.io — 1-day demo checklist

## Before you present (15 min setup)

1. **Terminal 1 — backend**
   ```powershell
   cd C:\FinTech_Hackathon\backend
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload --port 8000
   ```
   Open http://localhost:8000/api/health — should show `{"status":"ok"}`

2. **Terminal 2 — frontend**
   ```powershell
   cd C:\FinTech_Hackathon\ai-teaching-assistant
   npm run dev
   ```
   Open http://localhost:3000

3. **Check `.env`** in `backend/` has: `ILMU_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

4. **Use one PDF** you tested before (short, 2–5 pages works best)

---

## Demo script (~2 minutes)

### Student path (main story)
1. Home → **I'm a Student**
2. Mood check-in → pick any mood
3. **Upload** your PDF → wait for green “Step 2 — Reader found X concepts”
4. Click **Focus Slides** (or **Easy Read** for dyslexia-friendly)
5. Scroll slides → click **Download PPTX**
6. Open **Ilm** chat (bottom right) → ask: “Explain the main idea in simple words”

### Educator path (30 sec optional)
1. Home → **I'm an Educator**
2. Upload same PDF → pick **Focus Slides** or **Easy Read**
3. Open sidebar → see **heatmap / engagement** (fills after you generated on Student or Educator)
4. **Generate** weekly report if time allows

---

## If something breaks

| Problem | Fix |
|--------|-----|
| Upload fails | Backend running? Tesseract installed for images? |
| “File not found” on generate | Re-upload (server may have restarted) |
| Empty analytics | Generate once on Student or Educator first |
| Slow AI | Normal 20–60s; use shorter PDF |

---

## Pitch (30 seconds)

> “Many students with ADHD, dyslexia, or autism get the same dense PDF as everyone else. **ilm.io** uploads any material, an AI Reader breaks it into concept pockets, then specialised agents build focus slides, easy-read slides, worksheets, and a mood-aware tutor — in English, BM, Mandarin, and Tamil. Teachers see engagement heatmaps. Built for inclusive learning, AI for Good.”
