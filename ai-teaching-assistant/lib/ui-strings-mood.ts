import type { Language } from "@/lib/api";
import type { MoodKey } from "@/lib/mood-styles";

export type MoodCopy = {
  pickerTitle: string;
  pickerSub: string;
  cancel: string;
  skip: string;
  changeTitle: string;
  options: Record<MoodKey, { label: string; desc: string }>;
};

const EN: MoodCopy = {
  pickerTitle: "How are you feeling?",
  pickerSub: "Ilm adjusts tone and length — you can change this anytime.",
  cancel: "Cancel",
  skip: "Skip for now",
  changeTitle: "Change how you're feeling",
  options: {
    good: { label: "Good", desc: "Energetic mode" },
    okay: { label: "Okay", desc: "Steady pace" },
    tired: { label: "Tired", desc: "Gentle & short" },
    stressed: { label: "Stressed", desc: "Extra calm" },
  },
};

const MS: MoodCopy = {
  pickerTitle: "Apa perasaan anda?",
  pickerSub: "Ilm sesuaikan nada & panjang — boleh tukar bila-bila masa.",
  cancel: "Batal",
  skip: "Langkau dulu",
  changeTitle: "Tukar perasaan anda",
  options: {
    good: { label: "Baik", desc: "Mod bertenaga" },
    okay: { label: "Okay", desc: "Rentak stabil" },
    tired: { label: "Penat", desc: "Lembut & pendek" },
    stressed: { label: "Stres", desc: "Tenang sangat" },
  },
};

const ZH: MoodCopy = {
  pickerTitle: "你现在感觉怎么样？",
  pickerSub: "Ilm 会调整语气和长度 — 随时可以更改。",
  cancel: "取消",
  skip: "暂时跳过",
  changeTitle: "更改你的心情",
  options: {
    good: { label: "很好", desc: "精力充沛" },
    okay: { label: "还好", desc: "稳定节奏" },
    tired: { label: "疲惫", desc: "温和简短" },
    stressed: { label: "压力大", desc: "格外平静" },
  },
};

const TA: MoodCopy = {
  pickerTitle: "நீங்கள் எப்படி உணர்கிறீர்கள்?",
  pickerSub: "Ilm தொனி & நீளத்தை மாற்றும் — எப்போது வேண்டுமானாலும் மாற்றலாம்.",
  cancel: "ரத்து",
  skip: "இப்போது தவிர்",
  changeTitle: "உங்கள் உணர்வை மாற்று",
  options: {
    good: { label: "நன்று", desc: "ஆற்றல் முறை" },
    okay: { label: "சரி", desc: "நிலையான வேகம்" },
    tired: { label: "சோர்வு", desc: "மெதுவாக & குறுகிய" },
    stressed: { label: "அழுத்தம்", desc: "மிக அமைதி" },
  },
};

const ROJAK: MoodCopy = {
  pickerTitle: "How you feeling?",
  pickerSub: "Ilm adjust tone & length — boleh change anytime lah.",
  cancel: "Cancel",
  skip: "Skip dulu",
  changeTitle: "Change how you feeling",
  options: {
    good: { label: "Good", desc: "Energetic mode" },
    okay: { label: "Okay", desc: "Steady pace" },
    tired: { label: "Tired", desc: "Gentle & short" },
    stressed: { label: "Stressed", desc: "Extra calm" },
  },
};

export const MOOD_COPY: Record<Language, MoodCopy> = {
  en: EN,
  ms: MS,
  zh: ZH,
  ta: TA,
  rojak: ROJAK,
};
