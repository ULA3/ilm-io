/** Shared accessibility settings + Ilm text-to-speech */

import type { Language } from "@/lib/api";

export type AccSettings = {
  font: "default" | "dyslexic";
  size: "sm" | "md" | "lg";
  contrast: "normal" | "high";
  motion: "on" | "off";
  autoRead: boolean;
};

export const ACC_STORAGE_KEY = "ilmio_acc";
export const ACC_UPDATED_EVENT = "ilmio-acc-updated";
export const DOCK_MUSIC_PAUSE_EVENT = "ilmio-dock-music-pause";
export const DOCK_MUSIC_RESUME_EVENT = "ilmio-dock-music-resume";

export const DEFAULT_ACC: AccSettings = {
  font: "default",
  size: "md",
  contrast: "normal",
  motion: "on",
  autoRead: false,
};

export function getAccSettings(): AccSettings {
  if (typeof window === "undefined") return DEFAULT_ACC;
  try {
    const saved = localStorage.getItem(ACC_STORAGE_KEY);
    return saved ? { ...DEFAULT_ACC, ...JSON.parse(saved) } : DEFAULT_ACC;
  } catch {
    return DEFAULT_ACC;
  }
}

export function setAccSettings(next: AccSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACC_STORAGE_KEY, JSON.stringify(next));
  applyAccSettings(next);
  window.dispatchEvent(new CustomEvent(ACC_UPDATED_EVENT, { detail: next }));
}

export function applyAccSettings(s: AccSettings) {
  if (typeof document === "undefined") return;
  const body = document.body;
  document.documentElement.style.fontSize =
    s.size === "sm" ? "14px" : s.size === "lg" ? "18px" : "";
  if (s.font === "dyslexic") {
    const id = "opendyslexic-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.cdnfonts.com/css/opendyslexic";
      document.head.appendChild(link);
    }
    body.style.fontFamily = "'OpenDyslexic', sans-serif";
  } else {
    body.style.fontFamily = "";
  }
  body.classList.toggle("reduce-motion", s.motion === "off");
  body.classList.toggle("high-contrast", s.contrast === "high");
}

function stripForSpeech(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[•✦🎯📋❓🔤📅✓→]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

const LANG_MAP: Record<Language, string> = {
  en: "en-MY",
  ms: "ms-MY",
  zh: "zh-CN",
  ta: "ta-IN",
  rojak: "en-MY",
};

let speakGen = 0;
let voicesPrimed = false;

function primeVoices() {
  if (voicesPrimed || typeof window === "undefined") return;
  const list = window.speechSynthesis.getVoices();
  if (list.length > 0) voicesPrimed = true;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = primeVoices;
  primeVoices();
}

/** Speak Ilm reply; pauses dock music while speaking. */
export function speakIlmReply(text: string, lang: Language) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const clean = stripForSpeech(text);
  if (!clean) return;

  window.dispatchEvent(new Event(DOCK_MUSIC_PAUSE_EVENT));
  window.speechSynthesis.cancel();

  const gen = ++speakGen;
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = LANG_MAP[lang] ?? "en-MY";
  utter.rate = 0.92;
  utter.pitch = 1;

  primeVoices();
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang.startsWith(utter.lang.slice(0, 2))) ??
    voices.find((v) => v.lang.startsWith("en"));
  if (preferred) utter.voice = preferred;

  utter.onend = () => {
    if (gen === speakGen) {
      window.dispatchEvent(new Event(DOCK_MUSIC_RESUME_EVENT));
    }
  };
  utter.onerror = () => {
    if (gen === speakGen) {
      window.dispatchEvent(new Event(DOCK_MUSIC_RESUME_EVENT));
    }
  };

  window.speechSynthesis.speak(utter);
}

export function stopIlmSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  speakGen++;
  window.speechSynthesis.cancel();
  window.dispatchEvent(new Event(DOCK_MUSIC_RESUME_EVENT));
}
