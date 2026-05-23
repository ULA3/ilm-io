# Run ilm.io through ngrok (public demo URL)

## Why the page broke

If you open the app via **https://xxxx.ngrok-free.app** but `.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

the browser blocks API calls (**HTTPS page → HTTP localhost** = mixed content).  
Or judges on another phone cannot reach your `localhost` at all.

**Fix:** use **one ngrok tunnel** on the Next.js port and **leave `NEXT_PUBLIC_API_URL` empty** so `/api` is proxied to FastAPI.

---

## Quick setup (3 terminals)

### 1. Backend (port 8000)

```powershell
cd C:\FinTech_Hackathon\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend — check which port!

```powershell
cd C:\FinTech_Hackathon\ai-teaching-assistant
npm run dev
```

Note the port in the terminal:

- `Local: http://localhost:3000` → use **3000** in ngrok  
- `using available port 3001` → use **3001** in ngrok  

### 3. ngrok (same port as Next.js)

```powershell
ngrok http 3000
```

If Next is on 3001:

```powershell
ngrok http 3001
```

Copy the **https** URL (e.g. `https://abc123.ngrok-free.app`).

---

## `.env.local` (frontend)

```env
# Empty = API via same ngrok URL (/api → backend)
NEXT_PUBLIC_API_URL=

BACKEND_URL=http://localhost:8000
```

Restart `npm run dev` after changing this file.

---

## `backend/.env` (optional)

Set your public frontend URL for redirects / CORS allow list:

```env
FRONTEND_URL=https://YOUR-SUBDOMAIN.ngrok-free.app
```

CORS already allows `*.ngrok-free.app` and `*.ngrok.io` via regex.

---

## Test

1. Open `https://YOUR-SUBDOMAIN.ngrok-free.app`  
2. Student → upload a small PDF  
3. Generate Focus Slides  

If upload fails, confirm:

- Backend terminal shows requests  
- ngrok port matches Next.js port (3000 vs 3001)  
- You restarted Next after editing `.env.local`

---

## Two tunnels (advanced)

Only if you must expose API separately:

```powershell
ngrok http 8000
ngrok http 3000
```

Then set:

```env
NEXT_PUBLIC_API_URL=https://YOUR-API-SUBDOMAIN.ngrok-free.app
```

and `FRONTEND_URL` to the frontend ngrok URL. **Single tunnel + empty `NEXT_PUBLIC_API_URL` is simpler.**

---

## Local without ngrok

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Or leave empty and use http://localhost:3000 only (proxy mode).
