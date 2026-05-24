/** Client-side UI action hooks — events only; chat cannot execute actions. */

import type { AssistantPage } from "@/lib/app-context";

export const ILM_OPEN_DOCK_EVENT = "ilmio-open-dock";
export const ILM_DOCK_STOP_MUSIC_EVENT = "ilmio-dock-stop-music";
export const ILM_ASSISTANT_PAGE_EVENT = "ilmio-assistant-page-action";
export const ILM_SET_LANG_EVENT = "ilmio-set-lang";

export type IlmAssistantAction = { id: string; label: string };

/** @deprecated Chat no longer executes UI actions — kept for API type compatibility. */
export function executeAssistantAction(
  _id: string,
  _page: AssistantPage
): { ok: boolean; feedback?: string } {
  return {
    ok: false,
    feedback: "Use Controls (left tab) or the header language menu — Ilm chat cannot change settings.",
  };
}

/** @deprecated No-op — chat must never auto-apply system changes. */
export function applyAssistantActions(
  _actions: IlmAssistantAction[] | undefined,
  _page: AssistantPage,
  _appendBot: (text: string) => void
) {
  /* intentionally empty */
}
