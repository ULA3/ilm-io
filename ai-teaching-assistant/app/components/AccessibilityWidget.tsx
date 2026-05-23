"use client";

/** Legacy widget — settings live in SideDock; re-exports shared acc helpers. */
export {
  getAccSettings,
  setAccSettings,
  applyAccSettings,
  DEFAULT_ACC as DEFAULTS,
  type AccSettings,
} from "@/lib/accessibility";

export function AccessibilityWidget() {
  return null;
}
