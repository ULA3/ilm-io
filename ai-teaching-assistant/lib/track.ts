/**
 * Analytics — logs engagement to Supabase for educator dashboard heatmaps.
 * Uses seeded student Alex Chen until real auth exists.
 */
import * as api from "./api";

/** Seeded in backend/supabase/migrations/001_initial.sql */
export const DEMO_STUDENT_ID = "11111111-0000-0000-0000-000000000001";

export function getDemoSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem("ilmio_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("ilmio_session", id);
  }
  return id;
}

/** Fire-and-forget — never blocks the UI */
export function trackEvent(
  eventType: string,
  metadata: Record<string, unknown> = {},
  studentId = DEMO_STUDENT_ID
): void {
  api
    .logEvent(studentId, getDemoSessionId(), eventType, metadata)
    .catch(() => {});
}
