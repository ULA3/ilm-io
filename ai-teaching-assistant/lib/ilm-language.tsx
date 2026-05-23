"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Language } from "@/lib/api";
import { getUiStrings } from "@/lib/ui-strings";
import { ILM_SET_LANG_EVENT } from "@/lib/ilm-assistant-actions";

const STORAGE_KEY = "ilmio_lang";

const VALID_LANGS: Language[] = ["en", "ms", "zh", "ta", "rojak"];

type Ctx = {
  lang: Language;
  setLang: (l: Language) => void;
  ready: boolean;
};

const IlmLanguageContext = createContext<Ctx | null>(null);

/** document.documentElement.lang — rojak maps to en for screen readers */
const HTML_LANG: Record<Language, string> = {
  en: "en",
  ms: "ms",
  zh: "zh",
  ta: "ta",
  rojak: "en",
};

export function IlmLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [ready, setReady] = useState(false);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = HTML_LANG[l];
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored && VALID_LANGS.includes(stored)) {
        setLangState(stored);
        document.documentElement.lang = HTML_LANG[stored];
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const onSetLang = (e: Event) => {
      const next = (e as CustomEvent<{ lang: Language }>).detail?.lang;
      if (next && VALID_LANGS.includes(next)) setLang(next);
    };
    window.addEventListener(ILM_SET_LANG_EVENT, onSetLang);
    return () => window.removeEventListener(ILM_SET_LANG_EVENT, onSetLang);
  }, [setLang]);

  return (
    <IlmLanguageContext.Provider value={{ lang, setLang, ready }}>
      {children}
    </IlmLanguageContext.Provider>
  );
}

export function useIlmLanguage() {
  const ctx = useContext(IlmLanguageContext);
  if (!ctx) throw new Error("useIlmLanguage must be used within IlmLanguageProvider");
  return ctx;
}

/** Dropdown labels — rojak label comes from UI strings for consistency */
export function getLanguageOptions(lang: Language): { code: Language; label: string }[] {
  const ui = getUiStrings(lang);
  return [
    { code: "en", label: "English" },
    { code: "ms", label: "Bahasa Melayu" },
    { code: "zh", label: "普通话" },
    { code: "ta", label: "தமிழ்" },
    { code: "rojak", label: ui.lang.rojak },
  ];
}

/** @deprecated use getLanguageOptions(lang) */
export const ILM_LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "zh", label: "普通话" },
  { code: "ta", label: "தமிழ்" },
  { code: "rojak", label: "Rojak (Manglish)" },
];
