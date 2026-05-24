/**
 * Single source of truth for ilm.io learning formats & system flow.
 * Landing, student, educator, and sidebar all read from here — same labels, colours, links.
 */

export type SlideFormatKind =
  | "adhd"
  | "autism"
  | "dyslexia"
  | "mindmap"
  | "worksheet"
  | "transcribe";

export type EducatorOutputKind = "adhd" | "autism" | "dyslexia" | "transcribe";

export type StudentOutputKind = "adhd" | "autism" | "dyslexia" | "mindmap" | "worksheet" | "transcribe";

/** @deprecated Use EducatorOutputKind */
export type OutputKind = EducatorOutputKind;

export type FormatTheme = {
  border: string;
  borderActive: string;
  bgLo: string;
  bgActive: string;
  textHi: string;
  dot: string;
  chip: string;
};

export type IlmFormat = {
  kind: SlideFormatKind;
  label: string;
  shortLabel: string;
  emoji: string;
  tag: string;
  oneLine: string;
  why: string;
  sub: string;
  tips: string[];
  trackTopic: string;
  theme: FormatTheme;
  studentColor: string;
  studentActive: string;
  /** Where this format appears in the product */
  usedIn: ("student" | "educator" | "landing")[];
};

const FOCUS_THEME: FormatTheme = {
  border: "border-dust",
  borderActive: "border-dust",
  bgLo: "bg-dust-lo",
  bgActive: "bg-dust-lo",
  textHi: "text-dust-hi",
  dot: "bg-dust",
  chip: "bg-dust-lo text-dust-hi border-dust",
};

const CALM_THEME: FormatTheme = {
  border: "border-honey",
  borderActive: "border-honey",
  bgLo: "bg-honey-lo",
  bgActive: "bg-honey-lo",
  textHi: "text-honey-hi",
  dot: "bg-honey",
  chip: "bg-honey-lo text-bark-deep border-honey",
};

const EASY_THEME: FormatTheme = {
  border: "border-[#1A5C96]",
  borderActive: "border-[#1A5C96]",
  bgLo: "bg-[#E8F4FD]",
  bgActive: "bg-[#E8F4FD]",
  textHi: "text-[#1A5C96]",
  dot: "bg-[#1A5C96]",
  chip: "bg-[#E8F4FD] text-[#1A5C96] border-[#1A5C96]",
};

const VISUAL_THEME: FormatTheme = {
  border: "border-terra",
  borderActive: "border-terra",
  bgLo: "bg-terra-lo",
  bgActive: "bg-terra-lo",
  textHi: "text-terra-hi",
  dot: "bg-terra",
  chip: "bg-terra-lo text-terra-hi border-terra",
};

const PRACTICE_THEME: FormatTheme = {
  border: "border-violet-500",
  borderActive: "border-violet-500",
  bgLo: "bg-violet-50",
  bgActive: "bg-violet-50",
  textHi: "text-violet-700",
  dot: "bg-violet-500",
  chip: "bg-violet-50 text-violet-700 border-violet-300",
};

const AUDIO_THEME: FormatTheme = {
  border: "border-sage",
  borderActive: "border-sage",
  bgLo: "bg-sage-lo",
  bgActive: "bg-sage-lo",
  textHi: "text-sage-hi",
  dot: "bg-sage",
  chip: "bg-sage-lo text-sage-hi border-sage",
};

export const ILM_FORMATS: Record<SlideFormatKind, IlmFormat> = {
  adhd: {
    kind: "adhd",
    label: "Focus Slides",
    shortLabel: "Focus",
    emoji: "🧩",
    tag: "ADHD",
    oneLine: "One idea · short bursts",
    why: "Cuts extraneous load: one concept, visible progress, short bursts.",
    sub: "Timers · colour themes · one idea per slide · PPTX / PDF / PNG",
    tips: ["15–20 min blocks", "Short breaks help"],
    trackTopic: "Focus Slides",
    theme: FOCUS_THEME,
    studentColor: "border-dust-lo bg-white hover:border-dust hover:bg-dust-lo",
    studentActive: "border-dust bg-dust-lo",
    usedIn: ["student", "educator", "landing"],
  },
  autism: {
    kind: "autism",
    label: "Clear & Calm Slides",
    shortLabel: "Clear & Calm",
    emoji: "🗂️",
    tag: "Autism",
    oneLine: "Same layout every slide",
    why: "Predictable sections — you always know what comes next.",
    sub: "Navy layout · What/Details/Why · same structure every slide",
    tips: ["Say the plan first", "No surprise format changes"],
    trackTopic: "Clear & Calm Slides",
    theme: CALM_THEME,
    studentColor: "border-honey-lo bg-white hover:border-honey hover:bg-honey-lo",
    studentActive: "border-honey bg-honey-lo",
    usedIn: ["student", "educator", "landing"],
  },
  dyslexia: {
    kind: "dyslexia",
    label: "Easy Read Slides",
    shortLabel: "Easy Read",
    emoji: "📖",
    tag: "Dyslexia",
    oneLine: "Big text · more space",
    why: "Less visual crowding; highlights jump out without re-reading walls of text.",
    sub: "Huge text · yellow key phrases · bionic-friendly · all formats",
    tips: ["Add audio if you can", "Extra time on readings"],
    trackTopic: "Easy Read Slides",
    theme: EASY_THEME,
    studentColor: "border-[#E8F4FD] bg-white hover:border-[#1A5C96] hover:bg-[#E8F4FD]",
    studentActive: "border-[#1A5C96] bg-[#E8F4FD]",
    usedIn: ["student", "educator", "landing"],
  },
  mindmap: {
    kind: "mindmap",
    label: "Visual Mind Map",
    shortLabel: "Mind Map",
    emoji: "🗺️",
    tag: "Visual",
    oneLine: "See the whole topic first",
    why: "Spatial layout — see connections before details.",
    sub: "Hub-and-spoke branches · colour-coded · expand to explore",
    tips: ["Start at the centre hub", "Follow one branch at a time"],
    trackTopic: "Visual Mind Map",
    theme: VISUAL_THEME,
    studentColor: "border-terra-lo bg-white hover:border-terra hover:bg-terra-lo",
    studentActive: "border-terra bg-terra-lo",
    usedIn: ["student", "landing"],
  },
  worksheet: {
    kind: "worksheet",
    label: "Practice Questions",
    shortLabel: "Practice",
    emoji: "📝",
    tag: "Hands-on",
    oneLine: "Learn by doing, not only reading",
    why: "Active recall beats passive reading — especially when focus drifts.",
    sub: "Fill blanks · T/F · matching · Ilm checks answers · download",
    tips: ["Short sets of 3–5 questions", "Use Ilm to check answers"],
    trackTopic: "Practice Questions",
    theme: PRACTICE_THEME,
    studentColor: "border-violet-200 bg-white hover:border-violet-500 hover:bg-violet-50",
    studentActive: "border-violet-500 bg-violet-50",
    usedIn: ["student"],
  },
  transcribe: {
    kind: "transcribe",
    label: "Audio / Transcribe",
    shortLabel: "Audio",
    emoji: "🎧",
    tag: "Listen",
    oneLine: "Listen instead of reading",
    why: "Auditory path when text on screen is too heavy.",
    sub: "Spoken script · listen while resting eyes",
    tips: ["Pair with Easy Read slides", "Use calm environment"],
    trackTopic: "Transcriber",
    theme: AUDIO_THEME,
    studentColor: "border-sage-lo bg-white hover:border-sage hover:bg-sage-lo",
    studentActive: "border-sage bg-sage-lo",
    usedIn: ["student", "educator"],
  },
};

export const STUDENT_FORMAT_ORDER: StudentOutputKind[] = [
  "adhd",
  "autism",
  "dyslexia",
  "mindmap",
  "worksheet",
  "transcribe",
];

export const EDUCATOR_FORMAT_ORDER: EducatorOutputKind[] = [
  "adhd",
  "autism",
  "dyslexia",
  "transcribe",
];

/** Landing “before & after” maps to real student/educator formats */
export const LANDING_COMPARE_FORMATS: {
  id: string;
  formatKind?: SlideFormatKind;
  label: string;
  tag: string;
  isBefore?: boolean;
}[] = [
  { id: "original", label: "Original PDF", tag: "Before ilm.io", isBefore: true },
  { id: "adhd", formatKind: "adhd", label: "Focus Slides", tag: "Same as Student Step 3" },
  { id: "mindmap", formatKind: "mindmap", label: "Visual Mind Map", tag: "Same as Student Step 3" },
  { id: "dyslexia", formatKind: "dyslexia", label: "Easy Read + 🇲🇾 examples", tag: "Slides + local analogies" },
];

export type SystemStep = {
  id: string;
  emoji: string;
  label: string;
  hint: string;
  href?: string;
};

/** One connected pipeline — every feature hooks in */
export const ILM_SYSTEM_FLOW: SystemStep[] = [
  { id: "upload", emoji: "📄", label: "Upload", hint: "Your notes" },
  { id: "format", emoji: "🧩", label: "Format", hint: "Focus · Calm · Easy Read…" },
  { id: "learn", emoji: "✨", label: "Learn", hint: "Slides + images" },
  { id: "dock", emoji: "♿", label: "Dock", hint: "Font · motion · read aloud" },
  { id: "ilm", emoji: "✦", label: "Ilm", hint: "Quiz · summary · BM" },
  { id: "mood", emoji: "💛", label: "Mood", hint: "Gentle when tired" },
];

export function getFormat(kind: SlideFormatKind): IlmFormat {
  return ILM_FORMATS[kind];
}

export function formatLabel(kind: SlideFormatKind | EducatorOutputKind): string {
  return ILM_FORMATS[kind as SlideFormatKind]?.label ?? String(kind);
}

export function formatShortLabel(kind: SlideFormatKind | EducatorOutputKind): string {
  return ILM_FORMATS[kind as SlideFormatKind]?.shortLabel ?? String(kind);
}

export type FormatRecommendation = {
  kind: EducatorOutputKind;
  label: string;
  shortLabel: string;
  emoji: string;
  oneLine: string;
  tips: string[];
  theme: FormatTheme;
};

export function recommendedFormatForCondition(condition: string): FormatRecommendation {
  const c = condition.toLowerCase();
  let kind: EducatorOutputKind = "adhd";
  if (c.includes("dyslexia")) kind = "dyslexia";
  else if (c.includes("autism") || c.includes("spectrum")) kind = "autism";
  else if (c.includes("adhd")) kind = "adhd";

  const f = ILM_FORMATS[kind];
  return {
    kind,
    label: f.label,
    shortLabel: f.shortLabel,
    emoji: f.emoji,
    oneLine: f.oneLine,
    tips: f.tips,
    theme: f.theme,
  };
}

export const STUDENT_OUTPUT_FORMATS = STUDENT_FORMAT_ORDER.map((kind) => {
  const f = ILM_FORMATS[kind];
  return {
    kind,
    emoji: f.emoji,
    label: f.label,
    sub: f.sub,
    why: f.why,
    helps: [f.tag],
    color: f.studentColor,
    active: f.studentActive,
    theme: f.theme,
  };
});

export const EDUCATOR_OUTPUT_OPTIONS = EDUCATOR_FORMAT_ORDER.map((kind) => {
  const f = ILM_FORMATS[kind];
  return {
    kind,
    emoji: f.emoji,
    title: f.shortLabel,
    sub: f.sub,
    tag: f.tag,
    theme: f.theme,
  };
});

/** Profile builder on landing — same names as student buttons */
export const PROFILE_FORMAT_OPTIONS = [
  { key: "adhd", label: "Focus Slides" },
  { key: "mindmap", label: "Visual Mind Map" },
  { key: "worksheet", label: "Practice Qs" },
  { key: "dyslexia", label: "Easy Read" },
] as const;

export function educatorOutputButtonClass(kind: EducatorOutputKind, active: boolean): string {
  const f = ILM_FORMATS[kind];
  if (active) return `border-2 ${f.theme.borderActive} ${f.theme.bgActive}`;
  const idle: Record<EducatorOutputKind, string> = {
    adhd: "border-sand-mid bg-white hover:border-dust hover:bg-dust-lo",
    autism: "border-sand-mid bg-white hover:border-honey hover:bg-honey-lo",
    dyslexia: "border-sand-mid bg-white hover:border-[#1A5C96] hover:bg-[#E8F4FD]",
    transcribe: "border-sand-mid bg-white hover:border-sage hover:bg-sage-lo",
  };
  return idle[kind];
}

export function themeChipClass(kind: SlideFormatKind | EducatorOutputKind): string {
  return `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getFormat(kind as SlideFormatKind).theme.chip}`;
}
