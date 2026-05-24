import type { Language } from "@/lib/api";
import { EXTRA_COPY, type ExtraUiCopy } from "@/lib/ui-strings-extra";
import { FORMAT_COPY, type FormatCopy } from "@/lib/ui-strings-formats";
import { MOOD_COPY, type MoodCopy } from "@/lib/ui-strings-mood";
import { SHARED_COPY, type SharedUiCopy } from "@/lib/ui-strings-shared";

type StudentBase = {
  mode: string;
  myLearning: string;
  energy: string;
  pipeline: string;
  yourSteps: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  journey: { upload: string; reader: string; pickFormat: string; study: string };
  pipelineSteps: { upload: string; read: string; select: string; generate: string; done: string };
  reading: string;
  generating: string;
  pageTitle: string;
  pageSub: string;
  focusMode: string;
  upload: {
    dropHint: string;
    fileTypes: string;
    uploading: string;
    uploadError: string;
    or: string;
    takePhoto: string;
    takePhotoHint: string;
    active: string;
  };
};

type EducatorBase = {
  title: string;
  subtitle: string;
  docLoaded: string;
  welcomeReady: string;
  welcomeNoFile: string;
  placeholder: string;
  quickActions: string;
  error: string;
  prompts: { format: string; observer: string; worksheet: string; dyslexia: string };
  mode: string;
};

export type UiStrings = {
  mood: MoodCopy;
  formats: FormatCopy;
  shared: SharedUiCopy;
  lang: { label: string; hint: string; rojak: string };
  nav: { student: string; educator: string; home: string };
  student: StudentBase & ExtraUiCopy["student"];
  ilm: {
    tagline: string;
    welcomeLanding: string;
    welcomeReady: string;
    welcomeNoFile: string;
    placeholder: string;
    actions: { summarize: string; quiz: string; vocab: string; studyPlan: string; focusTip: string };
  };
  landing: {
    heroTitle: string;
    heroSub: string;
  };
  educator: EducatorBase & ExtraUiCopy["educator"];
};

export type UiStringsBase = {
  lang: UiStrings["lang"];
  nav: UiStrings["nav"];
  student: StudentBase;
  ilm: UiStrings["ilm"];
  landing: UiStrings["landing"];
  educator: EducatorBase;
};

const EN: UiStringsBase = {
  lang: {
    label: "Language",
    hint: "Menus & steps use this. Ilm + slides too.",
    rojak: "Rojak (Manglish)",
  },
  nav: { student: "Student", educator: "Educator", home: "← Back to home" },
  student: {
    mode: "Student Mode",
    myLearning: "My Learning",
    energy: "Your energy",
    pipeline: "Pipeline Status",
    yourSteps: "Your steps",
    step1: "Step 1 — Upload your material",
    step2: "Step 2 — Reader found concepts",
    step3: "Step 3 — Choose your learning format",
    step4: "Step 4 — Your output",
    journey: {
      upload: "Upload material",
      reader: "Reader finds concepts",
      pickFormat: "Pick one format",
      study: "Study your output",
    },
    pipelineSteps: {
      upload: "Upload",
      read: "Read",
      select: "Select",
      generate: "Generate",
      done: "Done",
    },
    reading: "Reader Agent analysing…",
    generating: "Agent generating…",
    pageTitle: "Hi! Let's learn together.",
    pageSub:
      "Not a generic summary. Your notes become slides, maps, and practice that fit how your brain learns.",
    focusMode: "Focus mode",
    upload: {
      dropHint: "Drop files here or click to browse",
      fileTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG · Multiple files OK",
      uploading: "Uploading…",
      uploadError: "One or more files failed to upload",
      or: "or",
      takePhoto: "Take a Photo",
      takePhotoHint: "(mobile camera)",
      active: "Active",
    },
  },
  ilm: {
    tagline: "Your study kaki",
    welcomeLanding:
      "Hi! I'm Ilm. Ask how ilm.io works — or anything about studying.",
    welcomeReady: "Hey! I'm Ilm. Ask about your notes, or tap Quick actions.",
    welcomeNoFile:
      "Hi! I'm Ilm — study buddy and app guide. Ask me anything on this page, or how to turn off music, change language, open Controls, etc.",
    placeholder: "Ask Ilm anything…",
    actions: {
      summarize: "Summarize",
      quiz: "Quiz me",
      vocab: "Hard words",
      studyPlan: "Study plan",
      focusTip: "Focus tip",
    },
  },
  landing: {
    heroTitle: "One note. Four ways to learn.",
    heroSub: "Built for ADHD, dyslexia & autism — Malaysian classrooms, four languages + rojak.",
  },
  educator: {
    title: "Ilm Educator",
    subtitle: "Teaching guide · YTL ILMU AI",
    docLoaded: "Material loaded ✓",
    welcomeReady:
      "Hello — I'm Ilm Educator. Ask about your upload, which format fits your learners, or inclusive teaching tips for Malaysian classrooms.",
    welcomeNoFile:
      "Hi — I'm Ilm Educator. Ask about formats, inclusion, or how ilm.io works anytime.",
    placeholder: "Ask about formats, slides, or your class…",
    quickActions: "Quick prompts",
    error: "Something went wrong. Check the backend is running and ILMU_API_KEY is set.",
    prompts: {
      format: "Which format for ADHD?",
      observer: "Explain Student Observer",
      worksheet: "Worksheet tips",
      dyslexia: "Dyslexia slide tips",
    },
    mode: "Educator",
  },
};

const MS: UiStringsBase = {
  lang: {
    label: "Bahasa",
    hint: "Menu & langkah ikut ini. Ilm + slaid juga.",
    rojak: "Rojak (Manglish)",
  },
  nav: { student: "Pelajar", educator: "Pendidik", home: "← Balik laman utama" },
  student: {
    mode: "Mod Pelajar",
    myLearning: "Pembelajaran Saya",
    energy: "Tenaga anda",
    pipeline: "Status saluran",
    yourSteps: "Langkah anda",
    step1: "Langkah 1 — Muat naik bahan",
    step2: "Langkah 2 — Pembaca jumpa konsep",
    step3: "Langkah 3 — Pilih format pembelajaran",
    step4: "Langkah 4 — Output anda",
    journey: {
      upload: "Muat naik bahan",
      reader: "Pembaca cari konsep",
      pickFormat: "Pilih satu format",
      study: "Belajar output anda",
    },
    pipelineSteps: {
      upload: "Muat naik",
      read: "Baca",
      select: "Pilih",
      generate: "Jana",
      done: "Siap",
    },
    reading: "Ejen Pembaca menganalisis…",
    generating: "Ejen menjana…",
    pageTitle: "Hai! Mari belajar bersama.",
    pageSub:
      "Bukan ringkasan biasa. Nota anda jadi slaid, peta minda, dan latihan yang sesuai cara otak anda belajar.",
    focusMode: "Mod fokus",
    upload: {
      dropHint: "Lepaskan fail di sini atau klik untuk pilih",
      fileTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG · Boleh muat naik banyak fail",
      uploading: "Memuat naik…",
      uploadError: "Satu atau lebih fail gagal dimuat naik",
      or: "atau",
      takePhoto: "Ambil Gambar",
      takePhotoHint: "(kamera telefon)",
      active: "Aktif",
    },
  },
  ilm: {
    tagline: "Kawan belajar anda",
    welcomeLanding:
      "Hai! Saya Ilm. Tanya cara ilm.io berfungsi — atau apa sahaja pasal belajar.",
    welcomeReady: "Hai! Saya Ilm. Tanya tentang nota anda, atau tekan tindakan pantas.",
    welcomeNoFile: "Hai! Saya Ilm. Boleh chat bila-bila — muat naik nota bila nak Quick actions.",
    placeholder: "Tanya Ilm apa sahaja…",
    actions: {
      summarize: "Ringkaskan",
      quiz: "Kuiz saya",
      vocab: "Perkataan sukar",
      studyPlan: "Pelan belajar",
      focusTip: "Tip fokus",
    },
  },
  landing: {
    heroTitle: "Satu nota. Empat cara belajar.",
    heroSub: "Untuk ADHD, disleksia & autisme — bilik darjah Malaysia, empat bahasa + rojak.",
  },
  educator: {
    title: "Ilm Educator",
    subtitle: "Panduan mengajar · YTL ILMU AI",
    docLoaded: "Bahan dimuat naik ✓",
    welcomeReady:
      "Hai — saya Ilm Educator. Tanya tentang muat naik anda, format untuk pelajar, atau tip pengajaran inklusif untuk bilik darjah Malaysia.",
    welcomeNoFile:
      "Hai — saya Ilm Educator. Tanya pasal format, inklusi, atau ilm.io bila-bila masa.",
    placeholder: "Tanya tentang format, slaid, atau kelas anda…",
    quickActions: "Prompt pantas",
    error: "Ada masalah. Pastikan backend berjalan dan ILMU_API_KEY diset.",
    prompts: {
      format: "Format mana untuk ADHD?",
      observer: "Terangkan Student Observer",
      worksheet: "Tip lembaran kerja",
      dyslexia: "Tip slaid disleksia",
    },
    mode: "Pendidik",
  },
};

const ZH: UiStringsBase = {
  lang: {
    label: "语言",
    hint: "页面菜单和步骤使用此语言。Ilm 和幻灯片也会跟随。",
    rojak: "Rojak（马式英语）",
  },
  nav: { student: "学生", educator: "教师", home: "← 返回首页" },
  student: {
    mode: "学生模式",
    myLearning: "我的学习",
    energy: "你的精力",
    pipeline: "流程状态",
    yourSteps: "你的步骤",
    step1: "步骤 1 — 上传材料",
    step2: "步骤 2 — 阅读器找到概念",
    step3: "步骤 3 — 选择学习格式",
    step4: "步骤 4 — 你的输出",
    journey: {
      upload: "上传材料",
      reader: "阅读器找概念",
      pickFormat: "选一种格式",
      study: "学习你的输出",
    },
    pipelineSteps: {
      upload: "上传",
      read: "阅读",
      select: "选择",
      generate: "生成",
      done: "完成",
    },
    reading: "阅读器分析中…",
    generating: "生成中…",
    pageTitle: "你好！一起学习吧。",
    pageSub: "不是普通摘要。你的笔记会变成幻灯片、思维导图和适合你大脑的学习练习。",
    focusMode: "专注模式",
    upload: {
      dropHint: "拖放文件到此处或点击浏览",
      fileTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG · 可多文件上传",
      uploading: "上传中…",
      uploadError: "一个或多个文件上传失败",
      or: "或",
      takePhoto: "拍照",
      takePhotoHint: "（手机相机）",
      active: "当前",
    },
  },
  ilm: {
    tagline: "你的学习伙伴",
    welcomeLanding: "你好！我是 Ilm。可以问 ilm.io 怎么用，或任何学习问题。",
    welcomeReady: "你好！我是 Ilm。可以问笔记，或点快捷操作。",
    welcomeNoFile: "你好！我是 Ilm。随时可聊 — 上传笔记后可使用快捷操作。",
    placeholder: "问 Ilm 任何问题…",
    actions: {
      summarize: "总结",
      quiz: "考我",
      vocab: "难词",
      studyPlan: "学习计划",
      focusTip: "专注提示",
    },
  },
  landing: {
    heroTitle: "一份笔记。四种学习方式。",
    heroSub: "为 ADHD、阅读障碍和自闭症设计 — 马来西亚课堂，四种语言 + rojak。",
  },
  educator: {
    title: "Ilm Educator",
    subtitle: "教学指南 · YTL ILMU AI",
    docLoaded: "材料已加载 ✓",
    welcomeReady:
      "你好 — 我是 Ilm Educator。可询问上传内容、哪种格式适合学生，或马来西亚包容性教学建议。",
    welcomeNoFile:
      "你好 — 我是 Ilm Educator。随时可问格式、包容性教学或 ilm.io 用法。",
    placeholder: "询问格式、幻灯片或班级…",
    quickActions: "快捷提问",
    error: "出错了。请确认后端运行中且已设置 ILMU_API_KEY。",
    prompts: {
      format: "ADHD 用哪种格式？",
      observer: "解释 Student Observer",
      worksheet: "练习册技巧",
      dyslexia: "阅读障碍幻灯片技巧",
    },
    mode: "教师",
  },
};

const TA: UiStringsBase = {
  lang: {
    label: "மொழி",
    hint: "மெனு & படிகள் இந்த மொழி. Ilm + ஸ்லைடுகளும்.",
    rojak: "Rojak (Manglish)",
  },
  nav: { student: "மாணவர்", educator: "ஆசிரியர்", home: "← முகப்புக்குத் திரும்பு" },
  student: {
    mode: "மாணவர் பயன்முறை",
    myLearning: "என் கற்றல்",
    energy: "உங்கள் ஆற்றல்",
    pipeline: "குழாய் நிலை",
    yourSteps: "உங்கள் படிகள்",
    step1: "படி 1 — பொருளைப் பதிவேற்று",
    step2: "படி 2 — வாசகர் கருத்துக்களைக் கண்டறிந்தது",
    step3: "படி 3 — கற்றல் வடிவத்தைத் தேர்ந்தெடு",
    step4: "படி 4 — உங்கள் வெளியீடு",
    journey: {
      upload: "பொருள் பதிவேற்றம்",
      reader: "வாசகர் கருத்துக்கள்",
      pickFormat: "ஒரு வடிவம் தேர்வு",
      study: "வெளியீட்டைப் படி",
    },
    pipelineSteps: {
      upload: "பதிவேற்றம்",
      read: "வாசிப்பு",
      select: "தேர்வு",
      generate: "உருவாக்கம்",
      done: "முடிந்தது",
    },
    reading: "வாசகர் முகவர் பகுப்பாய்வு…",
    generating: "முகவர் உருவாக்குகிறது…",
    pageTitle: "வணக்கம்! சேர்ந்து கற்போம்.",
    pageSub:
      "சாதாரண சுருக்கம் அல்ல. உங்கள் குறிப்புகள் உங்கள் மூளைக்கு ஏற்ற விலைப்படங்கள், வரைபடங்கள், பயிற்சியாக மாறும்.",
    focusMode: "கவன முறை",
    upload: {
      dropHint: "கோப்புகளை இங்கே விடுங்கள் அல்லது உலாவ கிளிக் செய்யுங்கள்",
      fileTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG · பல கோப்புகள் சரி",
      uploading: "பதிவேற்றுகிறது…",
      uploadError: "ஒன்று அல்லது அதற்கு மேற்பட்ட கோப்புகள் பதிவேற்றம் தோல்வி",
      or: "அல்லது",
      takePhoto: "புகைப்படம் எடு",
      takePhotoHint: "(மொபைல் கேமரா)",
      active: "செயலில்",
    },
  },
  ilm: {
    tagline: "உங்கள் கற்றல் துணை",
    welcomeLanding:
      "வணக்கம்! நான் Ilm. ilm.io எப்படி வேலை செய்யும் என்று கேளுங்கள் — அல்லது கற்றல் பற்றி எதையும்.",
    welcomeReady: "வணக்கம்! நான் Ilm. குறிப்புகளைப் பற்றி கேளுங்கள், அல்லது விரைவு செயல்களைத் தட்டுங்கள்.",
    welcomeNoFile: "வணக்கம்! நான் Ilm. எப்போது வேண்டுமானாலும் chat — Quick actions-க்கு notes upload செய்யுங்கள்.",
    placeholder: "Ilm-ஐ எதையும் கேளுங்கள்…",
    actions: {
      summarize: "சுருக்கம்",
      quiz: "வினாடி வினா",
      vocab: "கடின சொற்கள்",
      studyPlan: "படிப்புத் திட்டம்",
      focusTip: "கவனக் குறிப்பு",
    },
  },
  landing: {
    heroTitle: "ஒரு குறிப்பு. நான்கு கற்றல் வழிகள்.",
    heroSub: "ADHD, டிஸ்லெக்சியா & ஆட்டிசம் — மலேசியா வகுப்பறை, நான்கு மொழிகள் + rojak.",
  },
  educator: {
    title: "Ilm Educator",
    subtitle: "கற்பித்தல் வழிகாட்டி · YTL ILMU AI",
    docLoaded: "பொருள் ஏற்றப்பட்டது ✓",
    welcomeReady:
      "வணக்கம் — நான் Ilm Educator. உங்கள் பதிவேற்றம், மாணவர்களுக்கு எந்த வடிவம், அல்லது மலேசியா வகுப்பறை உள்ளடக்க குறிப்புகள் பற்றி கேளுங்கள்.",
    welcomeNoFile:
      "வணக்கம் — நான் Ilm Educator. வடிவங்கள், inclusion, ilm.io பற்றி எப்போது வேண்டுமானாலும் கேளுங்கள்.",
    placeholder: "வடிவங்கள், ஸ்லைடுகள், அல்லது வகுப்பு பற்றி கேளுங்கள்…",
    quickActions: "விரைவு கேள்விகள்",
    error: "பிழை ஏற்பட்டது. backend இயங்குகிறதா, ILMU_API_KEY உள்ளதா சரிபார்க்கவும்.",
    prompts: {
      format: "ADHD-க்கு எந்த வடிவம்?",
      observer: "Student Observer விளக்கு",
      worksheet: "Worksheet tips",
      dyslexia: "Dyslexia slide tips",
    },
    mode: "ஆசிரியர்",
  },
};

/** Rojak UI — friendly mix like everyday Malaysian apps */
const ROJAK: UiStringsBase = {
  lang: {
    label: "Language",
    hint: "Menu + steps ikut ni. Ilm + slides pun.",
    rojak: "Rojak (Manglish)",
  },
  nav: { student: "Student", educator: "Educator", home: "← Balik home" },
  student: {
    mode: "Student Mode",
    myLearning: "My Learning",
    energy: "Your energy",
    pipeline: "Pipeline status",
    yourSteps: "Your steps",
    step1: "Step 1 — Upload material",
    step2: "Step 2 — Reader jumpa concepts",
    step3: "Step 3 — Pilih learning format",
    step4: "Step 4 — Your output",
    journey: {
      upload: "Upload material",
      reader: "Reader cari concepts",
      pickFormat: "Pick one format",
      study: "Study your output",
    },
    pipelineSteps: {
      upload: "Upload",
      read: "Read",
      select: "Pilih",
      generate: "Generate",
      done: "Done",
    },
    reading: "Reader Agent tengah analyse…",
    generating: "Agent tengah generate…",
    pageTitle: "Hi! Jom belajar sama-sama lah.",
    pageSub:
      "Bukan summary biasa je. Notes jadi slides, mind map & practice — ikut cara otak you belajar.",
    focusMode: "Focus mode",
    upload: {
      dropHint: "Drop files sini atau click untuk browse",
      fileTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG · Boleh banyak files",
      uploading: "Uploading…",
      uploadError: "Satu atau lebih files gagal upload",
      or: "atau",
      takePhoto: "Ambil Gambar",
      takePhotoHint: "(kamera phone)",
      active: "Active",
    },
  },
  ilm: {
    tagline: "Your study kaki",
    welcomeLanding:
      "Hi! I'm Ilm. Tanya how ilm.io works — or anything pasal belajar lah.",
    welcomeReady: "Hey! I'm Ilm. Tanya pasal notes, or tap Quick actions.",
    welcomeNoFile:
      "Hi! I'm Ilm — study buddy and app guide. Ask me anything on this page, or how to turn off music, change language, open Controls, etc.",
    placeholder: "Tanya Ilm apa pun…",
    actions: {
      summarize: "Summarize",
      quiz: "Quiz me",
      vocab: "Hard words",
      studyPlan: "Study plan",
      focusTip: "Focus tip",
    },
  },
  landing: {
    heroTitle: "One note. Four ways to learn.",
    heroSub: "For ADHD, dyslexia & autism — Malaysian classroom, 4 languages + rojak.",
  },
  educator: {
    title: "Ilm Educator",
    subtitle: "Teaching guide · YTL ILMU AI",
    docLoaded: "Material loaded ✓",
    welcomeReady:
      "Hi — I'm Ilm Educator. Tanya pasal upload, which format suits your students, or inclusive teaching tips for Malaysian classroom lah.",
    welcomeNoFile:
      "Hi — I'm Ilm Educator. Tanya pasal format, inclusion, or ilm.io anytime lah.",
    placeholder: "Tanya pasal format, slides, or your class…",
    quickActions: "Quick prompts",
    error: "Something went wrong. Check backend running & ILMU_API_KEY set.",
    prompts: {
      format: "Which format for ADHD?",
      observer: "Explain Student Observer",
      worksheet: "Worksheet tips",
      dyslexia: "Dyslexia slide tips",
    },
    mode: "Educator",
  },
};

export const UI_STRINGS: Record<Language, UiStringsBase> = {
  en: EN,
  ms: MS,
  zh: ZH,
  ta: TA,
  rojak: ROJAK,
};

function mergeUi(base: UiStringsBase, lang: Language): UiStrings {
  const extra = EXTRA_COPY[lang] ?? EXTRA_COPY.en;
  return {
    ...base,
    mood: MOOD_COPY[lang] ?? MOOD_COPY.en,
    formats: FORMAT_COPY[lang] ?? FORMAT_COPY.en,
    shared: SHARED_COPY[lang] ?? SHARED_COPY.en,
    student: { ...base.student, ...extra.student },
    educator: { ...base.educator, ...extra.educator },
  };
}

export function getUiStrings(lang: Language): UiStrings {
  return mergeUi(UI_STRINGS[lang] ?? EN, lang);
}
