import type { Language } from "@/lib/api";
import type { EducatorOutputKind, SlideFormatKind } from "@/lib/ilm-formats";

export type FormatCopy = Record<
  SlideFormatKind,
  { label: string; shortLabel: string; sub: string; why: string; tag: string }
>;

const EN: FormatCopy = {
  adhd: {
    label: "Focus Slides",
    shortLabel: "Focus",
    sub: "Timers · colour themes · one idea per slide · PPTX / PDF / PNG",
    why: "Cuts extraneous load: one concept, visible progress, short bursts.",
    tag: "ADHD",
  },
  autism: {
    label: "Clear & Calm Slides",
    shortLabel: "Clear & Calm",
    sub: "Navy layout · What/Details/Why · same structure every slide",
    why: "Predictable sections — you always know what comes next.",
    tag: "Autism",
  },
  dyslexia: {
    label: "Easy Read Slides",
    shortLabel: "Easy Read",
    sub: "Huge text · yellow key phrases · bionic-friendly · all formats",
    why: "Less visual crowding; highlights jump out without re-reading walls of text.",
    tag: "Dyslexia",
  },
  mindmap: {
    label: "Visual Mind Map",
    shortLabel: "Mind Map",
    sub: "Hub-and-spoke branches · colour-coded · expand to explore",
    why: "Spatial layout — see connections before details.",
    tag: "Visual",
  },
  worksheet: {
    label: "Practice Questions",
    shortLabel: "Practice",
    sub: "Fill blanks · T/F · matching · Ilm checks answers · download",
    why: "Active recall beats passive reading — especially when focus drifts.",
    tag: "Hands-on",
  },
  transcribe: {
    label: "Audio / Transcribe",
    shortLabel: "Audio",
    sub: "Spoken script · listen while resting eyes",
    why: "Auditory path when text on screen is too heavy.",
    tag: "Listen",
  },
};

const MS: FormatCopy = {
  adhd: {
    label: "Slaid Fokus",
    shortLabel: "Fokus",
    sub: "Pemasa · tema warna · satu idea setiap slaid · PPTX / PDF / PNG",
    why: "Kurangkan beban: satu konsep, kemajuan jelas, sesi pendek.",
    tag: "ADHD",
  },
  autism: {
    label: "Slaid Jelas & Tenang",
    shortLabel: "Jelas & Tenang",
    sub: "Susun atur navy · Apa/Butiran/Mengapa · struktur sama setiap slaid",
    why: "Bahagian boleh diramal — anda tahu apa seterusnya.",
    tag: "Autisme",
  },
  dyslexia: {
    label: "Slaid Baca Mudah",
    shortLabel: "Baca Mudah",
    sub: "Teks besar · frasa kunci kuning · mesra bionic · semua format",
    why: "Kurang sesak visual; perkara penting menonjol.",
    tag: "Disleksia",
  },
  mindmap: {
    label: "Peta Minda Visual",
    shortLabel: "Peta Minda",
    sub: "Cabang hab · warna · kembangkan untuk teroka",
    why: "Susun atur ruang — nampak hubungan dulu.",
    tag: "Visual",
  },
  worksheet: {
    label: "Soalan Latihan",
    shortLabel: "Latihan",
    sub: "Isi tempat kosong · betul/salah · padanan · Ilm semak jawapan",
    why: "Ingat aktif lebih baik daripada baca pasif.",
    tag: "Hands-on",
  },
  transcribe: {
    label: "Audio / Transkrip",
    shortLabel: "Audio",
    sub: "Skrip lisan · dengar sambil rehatkan mata",
    why: "Laluan auditori bila teks di skrin terlalu berat.",
    tag: "Dengar",
  },
};

const ZH: FormatCopy = {
  adhd: {
    label: "专注幻灯片",
    shortLabel: "专注",
    sub: "计时器 · 彩色主题 · 每页一个想法 · PPTX / PDF / PNG",
    why: "减少干扰：一个概念、可见进度、短时段。",
    tag: "ADHD",
  },
  autism: {
    label: "清晰平静幻灯片",
    shortLabel: "清晰平静",
    sub: "海军蓝布局 · 什么/细节/为什么 · 每页结构相同",
    why: "可预测的部分 — 你知道接下来是什么。",
    tag: "自闭症",
  },
  dyslexia: {
    label: "易读幻灯片",
    shortLabel: "易读",
    sub: "大字体 · 黄色关键短语 · 友好分词 · 所有格式",
    why: "视觉不那么拥挤；重点更突出。",
    tag: "阅读障碍",
  },
  mindmap: {
    label: "视觉思维导图",
    shortLabel: "思维导图",
    sub: "中心辐射分支 · 颜色编码 · 展开探索",
    why: "空间布局 — 先看联系再看细节。",
    tag: "视觉",
  },
  worksheet: {
    label: "练习题",
    shortLabel: "练习",
    sub: "填空 · 对错 · 配对 · Ilm 检查答案",
    why: "主动回忆比被动阅读更有效。",
    tag: "动手",
  },
  transcribe: {
    label: "音频 / 转写",
    shortLabel: "音频",
    sub: "朗读脚本 · 休息时听",
    why: "屏幕文字太重时用听觉学习。",
    tag: "听",
  },
};

const TA: FormatCopy = {
  adhd: {
    label: "கவன ஸ்லைடுகள்",
    shortLabel: "கவனம்",
    sub: "டைமர் · வண்ண தீம் · ஒரு யோசனை ஒரு ஸ்லைடு",
    why: "கூடுதல் சுமை குறைக்கும்: ஒரு கருத்து, குறுகிய அமர்வுகள்.",
    tag: "ADHD",
  },
  autism: {
    label: "தெளிவான & அமைதி ஸ்லைடுகள்",
    shortLabel: "தெளிவு & அமைதி",
    sub: "நேவி தளவமைப்பு · என்ன/விவரம்/ஏன் · ஒரே கட்டமைப்பு",
    why: "கணிக்கக்கூடிய பகுதிகள் — அடுத்தது என்ன தெரியும்.",
    tag: "ஆட்டிசம்",
  },
  dyslexia: {
    label: "எளிதான வாசிப்பு ஸ்லைடுகள்",
    shortLabel: "எளிதான வாசிப்பு",
    sub: "பெரிய எழுத்து · மஞ்சள் முக்கிய சொற்கள்",
    why: "காட்சி குழப்பம் குறைவு; முக்கியம் தெளிவாக.",
    tag: "டிஸ்லெக்சியா",
  },
  mindmap: {
    label: "காட்சி மன வரைபடம்",
    shortLabel: "மன வரைபடம்",
    sub: "கிளைகள் · வண்ண குறியீடு",
    why: "இட அமைப்பு — தொடர்புகள் முதலில்.",
    tag: "காட்சி",
  },
  worksheet: {
    label: "பயிற்சி கேள்விகள்",
    shortLabel: "பயிற்சி",
    sub: "வெற்றிடம் · சரி/தவறு · Ilm பதில் சரிபார்க்கும்",
    why: "செயலில் நினைவு பாசிவ் வாசிப்பை விட நன்று.",
    tag: "கையால்",
  },
  transcribe: {
    label: "ஆடியோ / டிரான்ஸ்கிரைப்",
    shortLabel: "ஆடியோ",
    sub: "பேசும் ஸ்கிரிப்ட் · கண்களை ஓய்வெடுக்க கேளுங்கள்",
    why: "திரையில் உரை கனமாக இருக்கும்போது கேட்பு வழி.",
    tag: "கேள்வி",
  },
};

const ROJAK: FormatCopy = {
  ...EN,
  adhd: { ...EN.adhd, label: "Focus Slides", why: "One idea je — short burst, less pening." },
  autism: { ...EN.autism, label: "Clear & Calm Slides" },
  dyslexia: { ...EN.dyslexia, label: "Easy Read Slides" },
  mindmap: { ...EN.mindmap, label: "Visual Mind Map" },
  worksheet: { ...EN.worksheet, label: "Practice Questions" },
  transcribe: { ...EN.transcribe, label: "Audio / Transcribe" },
};

export const FORMAT_COPY: Record<Language, FormatCopy> = {
  en: EN,
  ms: MS,
  zh: ZH,
  ta: TA,
  rojak: ROJAK,
};
/** Localized sidebar tips for educator format recommendations */
export const EDUCATOR_FORMAT_TIPS: Partial<
  Record<Language, Partial<Record<EducatorOutputKind, string[]>>>
> = {
  en: {
    adhd: ["15–20 min blocks", "Short breaks help"],
    autism: ["Say the plan first", "No surprise format changes"],
    dyslexia: ["Add audio if you can", "Extra time on readings"],
    transcribe: ["Pair with Easy Read slides", "Use a calm environment"],
  },
  ms: {
    adhd: ["Blok 15–20 min", "Rehat pendek membantu"],
    autism: ["Sebut pelan dulu", "Jangan tukar format secara mengejut"],
    dyslexia: ["Tambah audio jika boleh", "Masa extra untuk bacaan"],
    transcribe: ["Gabung dengan slaid Baca Mudah", "Persekitaran tenang"],
  },
  zh: {
    adhd: ["15–20 分钟一块", "短休息有帮助"],
    autism: ["先说计划", "不要突然改格式"],
    dyslexia: ["尽量配音频", "阅读多给时间"],
    transcribe: ["搭配易读幻灯片", "安静环境更好"],
  },
  ta: {
    adhd: ["15–20 min blocks", "Short breaks help"],
    autism: ["Say the plan first", "No surprise format changes"],
    dyslexia: ["Add audio if you can", "Extra time on readings"],
    transcribe: ["Pair with Easy Read slides", "Use a calm environment"],
  },
  rojak: {
    adhd: ["15–20 min blocks lah", "Short breaks help"],
    autism: ["Say plan first", "No surprise format changes"],
    dyslexia: ["Add audio if boleh", "Extra time for readings"],
    transcribe: ["Pair with Easy Read slides", "Calm environment best"],
  },
};
