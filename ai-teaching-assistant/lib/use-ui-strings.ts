"use client";

import { getLandingCopy } from "@/lib/landing-copy";
import { getUiStrings } from "@/lib/ui-strings";
import { useIlmLanguage } from "@/lib/ilm-language";

/** UI copy for the active language (menus, steps, hints — not AI-generated slides). */
export function useUiStrings() {
  const { lang } = useIlmLanguage();
  return getUiStrings(lang);
}

/** Home page copy — updates when language changes. */
export function useLandingCopy() {
  const { lang } = useIlmLanguage();
  return getLandingCopy(lang);
}
