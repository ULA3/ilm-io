# ilm.io — Frontend (Next.js 15)

This is the Next.js frontend for ilm.io. See the **[root README](../README.md)** for full setup and run instructions.

## Quick start (frontend only)

```powershell
npm install
npm run dev
```

Open http://localhost:3000 — requires the FastAPI backend running on port 8000.

## Tech stack

- Next.js 15.5 · React 19 · TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- Google Fonts: Lora (headings) + Nunito (body)
- API client: `lib/api.ts` → calls `http://localhost:8000`
