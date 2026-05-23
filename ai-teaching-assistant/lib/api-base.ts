/**
 * API base URL for browser requests.
 * - Empty string → same-origin `/api/*` (Next.js rewrites to FastAPI). Use for ngrok / public demo.
 * - `http://localhost:8000` → direct backend (local dev only).
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw === undefined || raw === "") return "";
  return raw.replace(/\/$/, "");
}

/** Headers needed for ngrok free tier (avoids HTML warning page on API calls). */
export function apiFetchHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "ngrok-skip-browser-warning": "true",
    ...extra,
  };
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
