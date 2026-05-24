import type { Language } from "@/lib/api";

export type SharedUiCopy = {
  download: string;
  showDetails: string;
  hideClass: string;
  myClass: string;
  openClass: string;
  change: string;
  tryPrefix: string;
  makingSlides: string;
  generatingSeconds: string;
  complete: string;
  classTab: string;
  sidebar: {
    title: string;
    tapOutside: string;
    tapWho: string;
    generalClass: string;
    generalClassSub: string;
    bestFormat: string;
    hardTopics: string;
    observerTitle: string;
    scanClass: string;
    observerHint: string;
    needsHelp: string;
    coverage: string;
    weeklyNote: string;
    make: string;
    noReportYet: string;
    collapse: string;
  };
  dock: {
    controls: string;
    accessibility: string;
    motionOn: string;
    motionOff: string;
    autoRead: string;
    resetA11y: string;
    resetPosition: string;
    focusMusic: string;
  };
};

const EN: SharedUiCopy = {
  download: "Download",
  showDetails: "Show details",
  hideClass: "Hide class",
  myClass: "My class",
  openClass: "Open class panel",
  change: "Change",
  tryPrefix: "Try",
  makingSlides: "Making slides…",
  generatingSeconds: "20–40 seconds",
  complete: "Complete",
  classTab: "Class",
  sidebar: {
    title: "My class",
    tapOutside: "Tap outside or Esc to close",
    tapWho: "Whole class by default — or tap a student for personal tips.",
    generalClass: "Whole class",
    generalClassSub: "Materials for everyone",
    bestFormat: "Best format",
    hardTopics: "Hard topics",
    observerTitle: "Student Observer",
    scanClass: "Scan class",
    observerHint: "Flags who needs attention after you generate content.",
    needsHelp: "Needs help",
    coverage: "Coverage",
    weeklyNote: "Weekly note",
    make: "Make",
    noReportYet: "No report yet.",
    collapse: "Collapse",
  },
  dock: {
    controls: "Controls",
    accessibility: "Accessibility",
    motionOn: "Motion on",
    motionOff: "Motion off",
    autoRead: "Auto-read Ilm",
    resetA11y: "Reset a11y",
    resetPosition: "Reset position (left side)",
    focusMusic: "Focus music",
  },
};

const MS: SharedUiCopy = {
  download: "Muat turun",
  showDetails: "Tunjuk butiran",
  hideClass: "Sembunyikan kelas",
  myClass: "Kelas saya",
  openClass: "Buka panel kelas",
  change: "Tukar",
  tryPrefix: "Cuba",
  makingSlides: "Menjana slaid…",
  generatingSeconds: "20–40 saat",
  complete: "Siap",
  classTab: "Kelas",
  sidebar: {
    title: "Kelas saya",
    tapOutside: "Ketuk luar atau Esc untuk tutup",
    tapWho: "Kelas penuh secara lalai — atau ketuk pelajar untuk tip peribadi.",
    generalClass: "Kelas penuh",
    generalClassSub: "Bahan untuk semua",
    bestFormat: "Format terbaik",
    hardTopics: "Topik sukar",
    observerTitle: "Pemerhati Pelajar",
    scanClass: "Imbas kelas",
    observerHint: "Tanda siapa perlu perhatian selepas anda jana kandungan.",
    needsHelp: "Perlu bantuan",
    coverage: "Liputan",
    weeklyNote: "Nota mingguan",
    make: "Jana",
    noReportYet: "Tiada laporan lagi.",
    collapse: "Runtuhkan",
  },
  dock: {
    controls: "Kawalan",
    accessibility: "Kebolehcapaian",
    motionOn: "Gerakan hidup",
    motionOff: "Gerakan mati",
    autoRead: "Baca Ilm auto",
    resetA11y: "Set semula a11y",
    resetPosition: "Set semula kedudukan (kiri)",
    focusMusic: "Muzik fokus",
  },
};

const ZH: SharedUiCopy = {
  download: "下载",
  showDetails: "显示详情",
  hideClass: "隐藏班级",
  myClass: "我的班级",
  openClass: "打开班级面板",
  change: "更换",
  tryPrefix: "试试",
  makingSlides: "正在生成幻灯片…",
  generatingSeconds: "20–40 秒",
  complete: "完成",
  classTab: "班级",
  sidebar: {
    title: "我的班级",
    tapOutside: "点击外部或按 Esc 关闭",
    tapWho: "默认全班 — 或点选学生获取个性化建议。",
    generalClass: "全班",
    generalClassSub: "面向所有人的材料",
    bestFormat: "最佳格式",
    hardTopics: "难点主题",
    observerTitle: "学生观察",
    scanClass: "扫描班级",
    observerHint: "生成内容后标记需要关注的学生。",
    needsHelp: "需要帮助",
    coverage: "覆盖率",
    weeklyNote: "每周摘要",
    make: "生成",
    noReportYet: "暂无报告。",
    collapse: "收起",
  },
  dock: {
    controls: "控制",
    accessibility: "无障碍",
    motionOn: "动画开",
    motionOff: "动画关",
    autoRead: "自动朗读 Ilm",
    resetA11y: "重置无障碍",
    resetPosition: "重置位置（左侧）",
    focusMusic: "专注音乐",
  },
};

const TA: SharedUiCopy = {
  download: "பதிவிறக்க",
  showDetails: "விவரங்கள் காட்ட",
  hideClass: "வகுப்பை மறை",
  myClass: "என் வகுப்பு",
  openClass: "வகுப்பு panel திற",
  change: "மாற்று",
  tryPrefix: "முயற்சி",
  makingSlides: "ஸ்லைடுகள் உருவாக்குகிறது…",
  generatingSeconds: "20–40 வினாடிகள்",
  complete: "முடிந்தது",
  classTab: "வகுப்பு",
  sidebar: {
    title: "என் வகுப்பு",
    tapOutside: "வெளியே தட்டவும் அல்லது Esc",
    tapWho: "இயல்பாக முழு வகுப்பு — தனிப்பட்ட பரிந்துரைகளுக்கு மாணவரைத் தேர்ந்தெடுங்கள்.",
    generalClass: "முழு வகுப்பு",
    generalClassSub: "அனைவருக்கும்",
    bestFormat: "சிறந்த வடிவம்",
    hardTopics: "கடின தலைப்புகள்",
    observerTitle: "மாணவர் கண்காணிப்பு",
    scanClass: "வகுப்பை ஸ்கேன்",
    observerHint: "உள்ளடக்கம் உருவாக்கிய பிறகு கவனம் தேவையா?",
    needsHelp: "உதவி வேண்டும்",
    coverage: "உள்ளடக்கம்",
    weeklyNote: "வாராந்திர குறிப்பு",
    make: "உருவாக்க",
    noReportYet: "இன்னும் அறிக்கை இல்லை.",
    collapse: "சுருக்க",
  },
  dock: {
    controls: "கட்டுப்பாடு",
    accessibility: "அணுகல்",
    motionOn: "இயக்கம் ஆன்",
    motionOff: "இயக்கம் ஆஃப்",
    autoRead: "Ilm தானாக வாசி",
    resetA11y: "a11y மீட்டமை",
    resetPosition: "இடம் மீட்டமை (இடது)",
    focusMusic: "கவன இசை",
  },
};

const ROJAK: SharedUiCopy = {
  download: "Download",
  showDetails: "Show details",
  hideClass: "Hide class",
  myClass: "My class",
  openClass: "Open class panel",
  change: "Tukar",
  tryPrefix: "Try",
  makingSlides: "Making slides…",
  generatingSeconds: "20–40 sec je",
  complete: "Siap",
  classTab: "Class",
  sidebar: {
    title: "My class",
    tapOutside: "Tap outside or Esc to close",
    tapWho: "Whole class by default — or tap student for personal tips lah.",
    generalClass: "Whole class",
    generalClassSub: "For everyone",
    bestFormat: "Best format",
    hardTopics: "Hard topics",
    observerTitle: "Student Observer",
    scanClass: "Scan class",
    observerHint: "Flags who need attention after you generate content.",
    needsHelp: "Need help",
    coverage: "Coverage",
    weeklyNote: "Weekly note",
    make: "Make",
    noReportYet: "No report yet.",
    collapse: "Collapse",
  },
  dock: {
    controls: "Controls",
    accessibility: "Accessibility",
    motionOn: "Motion on",
    motionOff: "Motion off",
    autoRead: "Auto-read Ilm",
    resetA11y: "Reset a11y",
    resetPosition: "Reset position (left side)",
    focusMusic: "Focus music",
  },
};

export const SHARED_COPY: Record<Language, SharedUiCopy> = {
  en: EN,
  ms: MS,
  zh: ZH,
  ta: TA,
  rojak: ROJAK,
};
