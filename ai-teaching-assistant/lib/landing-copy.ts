import type { Language } from "@/lib/api";

export type LandingCopy = {
  hero: { line1: string; line2: string; line3: string; sub: string; cta: string };
  transform: { label: string; title: string; sub: string };
  research: { label: string; title: string; bullets: string[] };
  pain: { label: string; title: string; items: { title: string; desc: string }[] };
  compare: {
    label: string;
    title: string;
    before: string;
    after: string;
    beforeList: string[];
    afterList: string[];
  };
  profile: {
    label: string;
    title: string;
    condition: string;
    pace: string;
    output: string;
    fingerprint: string;
    fingerprintNote: string;
    fpKeys: Record<string, string>;
  };
  a11y: {
    label: string;
    title: string;
    dyslexic: string;
    larger: string;
    contrast: string;
    preview: string;
  };
  energy: {
    label: string;
    title: string;
    sub: string;
    high: string;
    steady: string;
    low: string;
    blocks: { high: string[]; steady: string[]; low: string[] };
  };
  start: {
    title: string;
    sub: string;
    studentTitle: string;
    studentDesc: string;
    educatorTitle: string;
    educatorDesc: string;
    langs: string;
  };
};

const EN: LandingCopy = {
  hero: {
    line1: "Learning your way.",
    line2: "At your pace.",
    line3: "In your language.",
    sub: "Your notes → slides that fit your brain. Calm layout. Four languages + rojak.",
    cta: "See how it works",
  },
  transform: { label: "See the difference", title: "One note, four ways to learn it", sub: "Same note · four formats · new topic each visit." },
  research: {
    label: "Why ilm.io",
    title: "Built for neurodivergent learners",
    bullets: [
      "One idea per slide — less overload",
      "Pictures and maps — not only text",
      "English · BM · 普通话 · தமிழ் · rojak",
      "Examples from real Malaysian life",
    ],
  },
  pain: {
    label: "Why we built this",
    title: "Built for real student struggles",
    items: [
      { title: "Too much text", desc: "Hard to start." },
      { title: "Short focus", desc: "Long chapters don't fit." },
      { title: "Reading hurts", desc: "Fonts weren't made for you." },
      { title: "Always different", desc: "Hard to trust the layout." },
    ],
  },
  compare: {
    label: "Before & after",
    title: "Learning before vs with ilm.io",
    before: "Before",
    after: "With ilm.io",
    beforeList: ["Same PDF for everyone", "Re-read chapters 3×", "No format choice", "Teachers guess what helps"],
    afterList: ["Pick your format", "Calm slides + pictures", "Teacher sees what helps"],
  },
  profile: {
    label: "Personalise",
    title: "Build your learning profile",
    condition: "How do you learn best?",
    pace: "Study pace",
    output: "Preferred output",
    fingerprint: "Your learning fingerprint",
    fingerprintNote: "Preview only — upload on Student to generate your real profile.",
    fpKeys: { visual: "Visual", auditory: "Auditory", structured: "Structured", interactive: "Interactive", calm: "Calm" },
  },
  a11y: {
    label: "Accessibility",
    title: "Controls that travel with you",
    dyslexic: "OpenDyslexic font",
    larger: "Larger text",
    contrast: "High contrast",
    preview: "This is how your study content can look — adjusted before you open a lesson. Available on every page via the ♿ dock.",
  },
  energy: {
    label: "Energy-aware",
    title: "Study plan that matches your energy",
    sub: "Drag to set how you feel — the plan adapts.",
    high: "High focus",
    steady: "Steady",
    low: "Low energy — gentle mode",
    blocks: {
      high: ["Focus slides — one concept", "Stretch break", "Practice questions"],
      steady: ["Easy-read slides", "Mind map review", "Ilm summarize + quiz"],
      low: ["Listen — short audio script", "Rest — no screens", "3 vocab words only"],
    },
  },
  start: {
    title: "Ready to start?",
    sub: "Pick one path. Switch anytime from the menu.",
    studentTitle: "Student",
    studentDesc: "Upload · transform · Ilm actions",
    educatorTitle: "Educator",
    educatorDesc: "Agents · insights · reports",
    langs: "English · BM · 普通话 · தமிழ் · rojak",
  },
};

const MS: LandingCopy = {
  hero: {
    line1: "Belajar cara anda.",
    line2: "Ikut rentak anda.",
    line3: "Dalam bahasa anda.",
    sub: "Nota anda → slaid yang sesuai minda anda. Susun atur tenang. Empat bahasa + rojak.",
    cta: "Lihat cara ia berfungsi",
  },
  transform: { label: "Lihat perbezaan", title: "Satu nota, empat cara belajar", sub: "Nota sama · empat format · topik baru setiap lawatan." },
  research: {
    label: "Mengapa ilm.io",
    title: "Dibina untuk pelajar neurodivergen",
    bullets: [
      "Satu idea setiap slaid — kurang beban",
      "Gambar dan peta — bukan teks sahaja",
      "English · BM · 普通话 · தமிழ் · rojak",
      "Contoh dari kehidupan Malaysia",
    ],
  },
  pain: {
    label: "Mengapa kami bina ini",
    title: "Untuk cabaran pelajar sebenar",
    items: [
      { title: "Terlalu banyak teks", desc: "Susah nak mula." },
      { title: "Fokus pendek", desc: "Bab panjang tak muat." },
      { title: "Membaca sakit", desc: "Font bukan untuk anda." },
      { title: "Sentiasa berbeza", desc: "Susah percaya susun atur." },
    ],
  },
  compare: {
    label: "Sebelum & selepas",
    title: "Belajar sebelum vs dengan ilm.io",
    before: "Sebelum",
    after: "Dengan ilm.io",
    beforeList: ["PDF sama untuk semua", "Baca semula bab 3×", "Tiada pilihan format", "Guru teka apa membantu"],
    afterList: ["Pilih format anda", "Slaid tenang + gambar", "Guru nampak apa membantu"],
  },
  profile: {
    label: "Peribadi",
    title: "Bina profil pembelajaran anda",
    condition: "Bagaimana anda belajar terbaik?",
    pace: "Rentak belajar",
    output: "Output pilihan",
    fingerprint: "Cap jari pembelajaran anda",
    fingerprintNote: "Pratonton sahaja — muat naik di Pelajar untuk profil sebenar.",
    fpKeys: { visual: "Visual", auditory: "Pendengaran", structured: "Berstruktur", interactive: "Interaktif", calm: "Tenang" },
  },
  a11y: {
    label: "Kebolehcapaian",
    title: "Kawalan ikut anda ke mana-mana",
    dyslexic: "Font OpenDyslexic",
    larger: "Teks lebih besar",
    contrast: "Kontras tinggi",
    preview: "Begini kandungan belajar anda boleh kelihatan — disesuaikan sebelum buka pelajaran. Ada di setiap halaman melalui dok ♿.",
  },
  energy: {
    label: "Sedar tenaga",
    title: "Pelan belajar ikut tenaga anda",
    sub: "Seret untuk set perasaan — pelan menyesuaikan.",
    high: "Fokus tinggi",
    steady: "Stabil",
    low: "Tenaga rendah — mod lembut",
    blocks: {
      high: ["Slaid fokus — satu konsep", "Rehat regangan", "Soalan latihan"],
      steady: ["Slaid baca mudah", "Semak peta minda", "Ilm ringkasan + kuiz"],
      low: ["Dengar — skrip audio pendek", "Rehat — tiada skrin", "3 perkataan vocab sahaja"],
    },
  },
  start: {
    title: "Sedia untuk mula?",
    sub: "Pilih satu laluan. Tukar bila-bila masa dari menu.",
    studentTitle: "Pelajar",
    studentDesc: "Muat naik · transform · tindakan Ilm",
    educatorTitle: "Pendidik",
    educatorDesc: "Ejen · insight · laporan",
    langs: "English · BM · 普通话 · தமிழ் · rojak",
  },
};

const ZH: LandingCopy = {
  hero: {
    line1: "按你的方式学习。",
    line2: "按你的节奏。",
    line3: "用你的语言。",
    sub: "笔记 → 适合大脑的幻灯片。简洁布局。四种语言 + rojak。",
    cta: "了解如何运作",
  },
  transform: { label: "看看差别", title: "一份笔记，四种学法", sub: "同一笔记 · 四种格式 · 每次访问新主题。" },
  research: {
    label: "为什么选择 ilm.io",
    title: "为神经多样性学习者打造",
    bullets: [
      "每张幻灯片一个想法 — 减少负担",
      "图片和思维导图 — 不只是文字",
      "English · BM · 普通话 · தமிழ் · rojak",
      "来自马来西亚生活的例子",
    ],
  },
  pain: {
    label: "我们为什么做",
    title: "针对真实学习困难",
    items: [
      { title: "文字太多", desc: "很难开始。" },
      { title: "注意力短", desc: "长章节不适合。" },
      { title: "阅读痛苦", desc: "字体不是为你设计的。" },
      { title: "总是不同", desc: "难以信任版面。" },
    ],
  },
  compare: {
    label: "之前与之后",
    title: "使用 ilm.io 前后的学习",
    before: "之前",
    after: "使用 ilm.io",
    beforeList: ["所有人同一份 PDF", "重读章节 3 遍", "没有格式选择", "老师猜测什么有用"],
    afterList: ["选择你的格式", "简洁幻灯片 + 图片", "老师看到什么有帮助"],
  },
  profile: {
    label: "个性化",
    title: "建立你的学习档案",
    condition: "你怎么学得最好？",
    pace: "学习节奏",
    output: "首选输出",
    fingerprint: "你的学习指纹",
    fingerprintNote: "仅为预览 — 在学生页上传材料生成真实档案。",
    fpKeys: { visual: "视觉", auditory: "听觉", structured: "结构化", interactive: "互动", calm: "平静" },
  },
  a11y: {
    label: "无障碍",
    title: "随你同行的控制",
    dyslexic: "OpenDyslexic 字体",
    larger: "更大文字",
    contrast: "高对比度",
    preview: "学习内容可以这样显示 — 打开课前即可调整。每页 ♿ 面板可用。",
  },
  energy: {
    label: "精力感知",
    title: "匹配精力的学习计划",
    sub: "拖动设置感受 — 计划会适应。",
    high: "高专注",
    steady: "稳定",
    low: "低精力 — 温和模式",
    blocks: {
      high: ["专注幻灯片 — 一个概念", "伸展休息", "练习题"],
      steady: ["易读幻灯片", "思维导图复习", "Ilm 总结 + 测验"],
      low: ["听 — 短音频脚本", "休息 — 不看屏幕", "只学 3 个词汇"],
    },
  },
  start: {
    title: "准备开始？",
    sub: "选一条路。随时从菜单切换。",
    studentTitle: "学生",
    studentDesc: "上传 · 转换 · Ilm 操作",
    educatorTitle: "教师",
    educatorDesc: "智能体 · 洞察 · 报告",
    langs: "English · BM · 普通话 · தமிழ் · rojak",
  },
};

const TA: LandingCopy = {
  hero: {
    line1: "உங்கள் வழியில் கற்றல்.",
    line2: "உங்கள் வேகத்தில்.",
    line3: "உங்கள் மொழியில்.",
    sub: "குறிப்புகள் → உங்கள் மூளைக்கு ஏற்ற ஸ்லைடுகள். அமைதியான அம்பு. நான்கு மொழிகள் + rojak.",
    cta: "எப்படி வேலை செய்கிறது பாருங்கள்",
  },
  transform: { label: "வித்தியாசம் பாருங்கள்", title: "ஒரு குறிப்பு, நான்கு கற்றல் வழிகள்", sub: "அதே குறிப்பு · நான்கு வடிவங்கள் · ஒவ்வொரு வருகையும் புதிய தலைப்பு." },
  research: {
    label: "ஏன் ilm.io",
    title: "நரம்பியல் வேறுபாடுள்ள கற்பவர்களுக்காக",
    bullets: [
      "ஒரு ஸ்லைடுக்கு ஒரு கருத்து — குறைந்த சுமை",
      "படங்கள் & வரைபடங்கள் — வெறும் உரை அல்ல",
      "English · BM · 普通话 · தமிழ் · rojak",
      "மலேசிய வாழ்க்கையிலிருந்து எடுத்துக்காட்டுகள்",
    ],
  },
  pain: {
    label: "ஏன் உருவாக்கினோம்",
    title: "உண்மையான மாணவர் சவால்களுக்காக",
    items: [
      { title: "அதிக உரை", desc: "தொடங்க கடினம்." },
      { title: "குறுகிய கவனம்", desc: "நீண்ட அத்தியாயங்கள் பொருந்தாது." },
      { title: "வாசிப்பு வலி", desc: "எழுத்துருக்கள் உங்களுக்காக இல்லை." },
      { title: "எப்போதும் மாறுபடும்", desc: "தளவமைப்பை நம்ப கடினம்." },
    ],
  },
  compare: {
    label: "முன் & பின்",
    title: "ilm.io உடன் முன்னும் பின்னும்",
    before: "முன்",
    after: "ilm.io உடன்",
    beforeList: ["அனைவருக்கும் ஒரே PDF", "அத்தியாயம் 3× மீண்டும் படித்தல்", "வடிவ தேர்வு இல்லை", "ஆசிரியர் யூகிக்கிறார்"],
    afterList: ["உங்கள் வடிவம் தேர்வு", "அமைதியான ஸ்லைடுகள் + படங்கள்", "ஆசிரியர் எது உதவுகிறது பார்க்கிறார்"],
  },
  profile: {
    label: "தனிப்பயன்",
    title: "கற்றல் சுயவிவரம் உருவாக்குங்கள்",
    condition: "நீங்கள் எப்படி சிறப்பாக கற்கிறீர்கள்?",
    pace: "படிப்பு வேகம்",
    output: "விருப்பமான வெளியீடு",
    fingerprint: "உங்கள் கற்றல் கைரேகை",
    fingerprintNote: "முன்னோட்டம் மட்டும் — மாணவர் பக்கத்தில் பதிவேற்றி உண்மையான சுயவிவரம்.",
    fpKeys: { visual: "பார்வை", auditory: "செவி", structured: "கட்டமைப்பு", interactive: "ஊடாடல்", calm: "அமைதி" },
  },
  a11y: {
    label: "அணுகல்",
    title: "உங்களுடன் பயணிக்கும் கட்டுப்பாடுகள்",
    dyslexic: "OpenDyslexic எழுத்து",
    larger: "பெரிய உரை",
    contrast: "உயர் மாறுபாடு",
    preview: "படிப்பு உள்ளடக்கம் இப்படி தோற்றம் — பாடம் திறப்பதற்கு முன் சரிசெய்யலாம். ஒவ்வொரு பக்கத்திலும் ♿ dock.",
  },
  energy: {
    label: "ஆற்றல் அறிதல்",
    title: "ஆற்றலுக்கு ஏற்ற படிப்புத் திட்டம்",
    sub: "எப்படி உணர்கிறீர்கள் என்பதை இழுக்கவும் — திட்டம் மாறும்.",
    high: "உயர் கவனம்",
    steady: "நிலையான",
    low: "குறைந்த ஆற்றல் — மென்மையான முறை",
    blocks: {
      high: ["Focus slides — one concept", "Stretch break", "Practice questions"],
      steady: ["Easy-read slides", "Mind map review", "Ilm summarize + quiz"],
      low: ["Listen — audio script", "Rest — no screens", "3 vocab words"],
    },
  },
  start: {
    title: "தொடங்க தயாரா?",
    sub: "ஒரு பாதை தேர்வு. மேல் மெனுவில் எப்போது வேண்டுமானாலும் மாற்றலாம்.",
    studentTitle: "மாணவர்",
    studentDesc: "Upload · transform · Ilm",
    educatorTitle: "ஆசிரியர்",
    educatorDesc: "Agents · insights · reports",
    langs: "English · BM · 普通话 · தமிழ் · rojak",
  },
};

const ROJAK: LandingCopy = {
  ...EN,
  hero: {
    line1: "Belajar your way.",
    line2: "At your pace lah.",
    line3: "In your language.",
    sub: "Notes → slides that fit your brain. Calm layout. 4 languages + rojak.",
    cta: "See how it works",
  },
  transform: { label: "See the difference", title: "One note, four ways to learn", sub: "Same note · four formats · new topic each visit." },
  start: {
    ...EN.start,
    studentDesc: "Upload · transform · Ilm actions",
    educatorDesc: "Agents · insights · reports",
    langs: "English · BM · 普通话 · தமிழ் · rojak",
  },
};

export const LANDING_COPY: Record<Language, LandingCopy> = {
  en: EN,
  ms: MS,
  zh: ZH,
  ta: TA,
  rojak: ROJAK,
};

export function getLandingCopy(lang: Language): LandingCopy {
  return LANDING_COPY[lang] ?? EN;
}
