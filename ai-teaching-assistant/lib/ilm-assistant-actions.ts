/** Client-side UI actions Ilm can trigger from chat action chips. */

import type { Language } from "@/lib/api";
import {
  DOCK_MUSIC_PAUSE_EVENT,
  DOCK_MUSIC_RESUME_EVENT,
  getAccSettings,
  setAccSettings,
} from "@/lib/accessibility";
import type { AssistantPage } from "@/lib/app-context";

export const ILM_OPEN_DOCK_EVENT = "ilmio-open-dock";
export const ILM_DOCK_STOP_MUSIC_EVENT = "ilmio-dock-stop-music";
export const ILM_ASSISTANT_PAGE_EVENT = "ilmio-assistant-page-action";
export const ILM_SET_LANG_EVENT = "ilmio-set-lang";

export type IlmAssistantAction = { id: string; label: string };

const LANG_IDS: Record<string, Language> = {
  lang_en: "en",
  lang_ms: "ms",
  lang_zh: "zh",
  lang_ta: "ta",
  lang_rojak: "rojak",
};

function setDark(on: boolean) {
  document.documentElement.classList.toggle("dark", on);
  try {
    localStorage.setItem("ilm-dark", String(on));
  } catch {
    /* ignore */
  }
}

const PAGE_ONLY = new Set([
  "open_mood_picker",
  "toggle_focus_mode",
  "scroll_student_upload",
  "scroll_educator_upload",
  "open_class_panel",
  "close_class_panel",
]);

export function executeAssistantAction(
  id: string,
  page: AssistantPage
): { ok: boolean; feedback?: string } {
  if (PAGE_ONLY.has(id)) {
    if (id === "scroll_student_upload" && page !== "student") {
      return { ok: false, feedback: "Upload is on the Student page — want me to take you there?" };
    }
    if (id === "scroll_educator_upload" && page !== "educator") {
      return { ok: false, feedback: "Upload is on the Educator page." };
    }
    if (
      (id === "open_mood_picker" || id === "toggle_focus_mode") &&
      page !== "student"
    ) {
      return { ok: false, feedback: "That control is on the Student page." };
    }
    if (
      (id === "open_class_panel" || id === "close_class_panel") &&
      page !== "educator"
    ) {
      return { ok: false, feedback: "Class panel is on the Educator page." };
    }
    window.dispatchEvent(
      new CustomEvent(ILM_ASSISTANT_PAGE_EVENT, { detail: { id } })
    );
    return { ok: true };
  }

  const acc = getAccSettings();
  switch (id) {
    case "open_controls":
      window.dispatchEvent(new Event(ILM_OPEN_DOCK_EVENT));
      return { ok: true };
    case "music_off":
      window.dispatchEvent(new Event(DOCK_MUSIC_PAUSE_EVENT));
      window.dispatchEvent(new Event(ILM_DOCK_STOP_MUSIC_EVENT));
      return { ok: true };
    case "music_on":
      window.dispatchEvent(new Event(DOCK_MUSIC_RESUME_EVENT));
      return { ok: true };
    case "dark_on":
      setDark(true);
      return { ok: true };
    case "dark_off":
      setDark(false);
      return { ok: true };
    case "reduce_motion_on":
      setAccSettings({ ...acc, motion: "off" });
      return { ok: true };
    case "reduce_motion_off":
      setAccSettings({ ...acc, motion: "on" });
      return { ok: true };
    case "high_contrast_on":
      setAccSettings({ ...acc, contrast: "high" });
      return { ok: true };
    case "high_contrast_off":
      setAccSettings({ ...acc, contrast: "normal" });
      return { ok: true };
    case "dyslexic_font_on":
      setAccSettings({ ...acc, font: "dyslexic" });
      return { ok: true };
    case "dyslexic_font_off":
      setAccSettings({ ...acc, font: "default" });
      return { ok: true };
    case "font_larger":
      setAccSettings({ ...acc, size: acc.size === "sm" ? "md" : "lg" });
      return { ok: true };
    case "font_smaller":
      setAccSettings({ ...acc, size: acc.size === "lg" ? "md" : "sm" });
      return { ok: true };
    case "auto_read_on":
      setAccSettings({ ...acc, autoRead: true });
      return { ok: true };
    case "auto_read_off":
      setAccSettings({ ...acc, autoRead: false });
      return { ok: true };
    case "go_student":
      window.location.href = "/student";
      return { ok: true };
    case "go_educator":
      window.location.href = "/educator";
      return { ok: true };
    case "go_home":
      window.location.href = "/";
      return { ok: true };
    default:
      if (id in LANG_IDS) {
        window.dispatchEvent(
          new CustomEvent(ILM_SET_LANG_EVENT, { detail: { lang: LANG_IDS[id] } })
        );
        return { ok: true };
      }
      return { ok: false };
  }
}

export function applyAssistantActions(
  actions: IlmAssistantAction[] | undefined,
  page: AssistantPage,
  appendBot: (text: string) => void
) {
  if (!actions?.length) return;
  for (const a of actions) {
    const res = executeAssistantAction(a.id, page);
    if (!res.ok && res.feedback) appendBot(res.feedback);
  }
}
