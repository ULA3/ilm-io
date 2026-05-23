# ilm.io — Demo checklist

## Before you present (15 min setup)

1. **Terminal 1 — backend**
   ```powershell
   cd C:\FinTech_Hackathon\backend
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   Open http://localhost:8000/api/health — should show `{"status":"ok"}`

2. **Terminal 2 — frontend**
   ```powershell
   cd C:\FinTech_Hackathon\ai-teaching-assistant
   npm run dev
   ```
   Open http://localhost:3000 (or 3001 if 3000 is busy)

3. **Check `backend/.env`** has: `ILMU_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

4. **Public URL (optional):** see [`NGROK.md`](NGROK.md)

---

## Demo script (~2 minutes)

### Student path
1. Home → **I'm a Student**
2. Mood check-in → upload PDF → **Focus Slides** or **Easy Read**
3. Scroll slides → download PPTX → ask **Ilm** a question

### Educator path
1. Home → **I'm an Educator**
2. Open **Class insights** (right panel) → select a student
3. Upload material → use **recommended format** for that student
4. Generate weekly report from the sidebar

---

## Pitch (30 seconds)

> “Many students with ADHD, dyslexia, or autism get the same dense PDF as everyone else. **ilm.io** turns materials into focus slides, easy-read decks, calm structured slides, and a mood-aware tutor — in four languages. Teachers see who is struggling and get AI weekly summaries.”

---

## If something breaks

| Problem | Fix |
|--------|-----|
| Upload fails | Backend running? Tesseract for images? |
| “File not found” on generate | Re-upload after server restart |
| Empty analytics | Generate once on Student or Educator first |
| ngrok issues | See NGROK.md — match ngrok port to `npm run dev` port |
