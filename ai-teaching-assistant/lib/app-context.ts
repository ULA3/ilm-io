/** Build live UI snapshot sent to Ilm backends for app-wide assistance. */

import type { Language } from "@/lib/api";
import { getAccSettings } from "@/lib/accessibility";

export type AssistantPage = "landing" | "student" | "educator";

export type AppContextExtras = {
  hasFile?: boolean;
  mood?: string;
  focusMode?: boolean;
  moodCheckedIn?: boolean;
  classPanelOpen?: boolean;
  filename?: string;
};

export function buildAppContextSnapshot(
  page: AssistantPage,
  lang: Language,
  extras: AppContextExtras = {}
): string {
  const acc = typeof window !== "undefined" ? getAccSettings() : null;
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const lines = [
    `page=${page}`,
    `route=${typeof window !== "undefined" ? window.location.pathname : page}`,
    `ui_language=${lang}`,
  ];
  if (acc) {
    lines.push(
      `font=${acc.font}`,
      `text_size=${acc.size}`,
      `high_contrast=${acc.contrast === "high"}`,
      `reduce_motion=${acc.motion === "off"}`,
      `auto_read_ilm=${acc.autoRead}`,
      `dark_mode=${dark}`
    );
  }
  if (extras.hasFile != null) lines.push(`document_loaded=${extras.hasFile}`);
  if (extras.filename) lines.push(`filename=${extras.filename}`);
  if (extras.mood) lines.push(`mood=${extras.mood}`);
  if (extras.moodCheckedIn != null) lines.push(`mood_checked_in=${extras.moodCheckedIn}`);
  if (extras.focusMode != null) lines.push(`focus_mode=${extras.focusMode}`);
  if (extras.classPanelOpen != null) lines.push(`class_panel_open=${extras.classPanelOpen}`);
  return lines.join("\n");
}
