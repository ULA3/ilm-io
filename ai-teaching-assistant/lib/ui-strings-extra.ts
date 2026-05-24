import type { Language } from "@/lib/api";

/** Extra student/educator copy merged into getUiStrings — keeps main file smaller. */
export type ExtraUiCopy = {
  student: {
    readerScanTitle: string;
    readerScanSub: string;
    readerPhases: [string, string, string];
    ilmFormatHint: string;
    truncatedTitle: string;
    truncatedSub: string;
    genMessages: [string, string, string];
    journeyHint: string;
    couldNotFinish: string;
    backToSelection: string;
  };
  educator: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step4Slides: string;
    pickFormat: string;
    uploadTitle: string;
    uploadDrop: string;
    uploadTypes: string;
    uploadUploading: string;
    uploadFailed: string;
    uploadReplace: string;
    dropClass: string;
    readerScanTitle: string;
    readerScanSub: string;
    readerPhases: [string, string, string];
    truncatedTitle: string;
    truncatedSub: string;
    genMessages: [string, string, string];
    openClassStep: string;
    readingFile: string;
    bestFor: string;
    bestForAll: string;
    concepts: string;
    couldNotFinish: string;
    backToSelection: string;
  };
};

const EN: ExtraUiCopy = {
  student: {
    readerScanTitle: "Reader Agent is scanning your document…",
    readerScanSub: "Extracting knowledge pockets. This takes about 15–30 seconds.",
    readerPhases: ["Reading content", "Identifying concepts", "Forming pockets"],
    ilmFormatHint: "Need a summary or quiz? Open Ilm (bottom right) for actions — not just chat.",
    truncatedTitle: "Large document — we read the key opening sections first.",
    truncatedSub: "All formats work on this portion. Split into smaller uploads for full coverage.",
    genMessages: [
      "Reading your document…",
      "Adapting for your learning style…",
      "Almost ready…",
    ],
    journeyHint:
      "Choose a format in the main area. For a quick recap or quiz, use Ilm (✦) on the right.",
    couldNotFinish: "Could not finish",
    backToSelection: "← Back to selection",
  },
  educator: {
    step1: "1 · Upload",
    step2: "2 · Upload",
    step3: "3 · Pick format",
    step4: "4 · Your slides",
    step4Slides: "4 · Your slides",
    pickFormat: "3 · Pick format",
    uploadTitle: "2 · Upload",
    uploadDrop: "Drop class material here",
    uploadTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG",
    uploadUploading: "Uploading…",
    uploadFailed: "Upload failed",
    uploadReplace: "Click to replace",
    dropClass: "Drop class material here",
    readerScanTitle: "Reader Agent is scanning your document…",
    readerScanSub: "Extracting knowledge pockets. This takes about 15–30 seconds.",
    readerPhases: ["Reading content", "Identifying concepts", "Forming pockets"],
    truncatedTitle: "Large document — we read the key opening sections first.",
    truncatedSub: "All formats work on this portion. Split into smaller uploads for full coverage.",
    genMessages: [
      "Reading your document…",
      "Adapting for your learning style…",
      "Almost ready…",
    ],
    openClassStep: "Optional: open class panel to pick a student for personal tips",
    readingFile: "Reading file…",
    bestFor: "Best for",
    bestForAll: "Best for whole class",
    concepts: "Concept pockets",
    couldNotFinish: "Could not finish",
    backToSelection: "← Back to selection",
  },
};

const MS: ExtraUiCopy = {
  student: {
    readerScanTitle: "Ejen Pembaca mengimbas dokumen anda…",
    readerScanSub: "Mengekstrak poket pengetahuan. Kira-kira 15–30 saat.",
    readerPhases: ["Membaca kandungan", "Mengenal pasti konsep", "Membentuk poket"],
    ilmFormatHint: "Nak ringkasan atau kuiz? Buka Ilm (kanan bawah) untuk tindakan — bukan chat sahaja.",
    truncatedTitle: "Dokumen anda panjang — kami guna bahagian pertama.",
    truncatedSub: "Untuk hasil terbaik, muat naik bahagian yang lebih pendek.",
    genMessages: ["Membaca dokumen…", "Menyesuaikan gaya pembelajaran…", "Hampir siap…"],
    journeyHint:
      "Pilih format di kawasan utama. Untuk ringkasan atau kuiz pantas, guna Ilm (✦) di kanan.",
    couldNotFinish: "Tidak dapat siapkan",
    backToSelection: "← Kembali ke pilihan",
  },
  educator: {
    step1: "1 · Muat naik",
    step2: "2 · Muat naik",
    step3: "3 · Pilih format",
    step4: "4 · Slaid anda",
    step4Slides: "4 · Slaid anda",
    pickFormat: "3 · Pilih format",
    uploadTitle: "2 · Muat naik",
    uploadDrop: "Lepaskan bahan kelas di sini",
    uploadTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG",
    uploadUploading: "Memuat naik…",
    uploadFailed: "Muat naik gagal",
    uploadReplace: "Klik untuk ganti",
    dropClass: "Lepaskan bahan kelas di sini",
    readerScanTitle: "Ejen Pembaca mengimbas dokumen…",
    readerScanSub: "Mengekstrak poket pengetahuan. Kira-kira 15–30 saat.",
    readerPhases: ["Membaca kandungan", "Mengenal pasti konsep", "Membentuk poket"],
    truncatedTitle: "Dokumen anda panjang — kami guna bahagian pertama.",
    truncatedSub: "Untuk hasil terbaik, muat naik bahagian yang lebih pendek.",
    genMessages: ["Membaca dokumen…", "Menyesuaikan…", "Hampir siap…"],
    openClassStep: "Pilihan: buka panel kelas untuk tip peribadi pelajar",
    readingFile: "Membaca fail…",
    bestFor: "Terbaik untuk",
    bestForAll: "Terbaik untuk kelas penuh",
    concepts: "Poket konsep",
    couldNotFinish: "Tidak dapat siapkan",
    backToSelection: "← Kembali ke pilihan",
  },
};

const ZH: ExtraUiCopy = {
  student: {
    readerScanTitle: "阅读器正在扫描你的文档…",
    readerScanSub: "正在提取知识口袋。大约需要 15–30 秒。",
    readerPhases: ["阅读内容", "识别概念", "形成口袋"],
    ilmFormatHint: "需要总结或测验？打开 Ilm（右下角）使用快捷操作 — 不只是聊天。",
    truncatedTitle: "文档较长 — 我们使用了前面的部分。",
    truncatedSub: "为获得最佳效果，请尝试上传较短的章节。",
    genMessages: ["正在阅读文档…", "正在适配你的学习风格…", "快好了…"],
    journeyHint: "在主区域选择格式。快速回顾或测验请用右侧的 Ilm (✦)。",
    couldNotFinish: "无法完成",
    backToSelection: "← 返回选择",
  },
  educator: {
    step1: "1 · 上传",
    step2: "2 · 上传",
    step3: "3 · 选择格式",
    step4: "4 · 你的幻灯片",
    step4Slides: "4 · 你的幻灯片",
    pickFormat: "3 · 选择格式",
    uploadTitle: "2 · 上传",
    uploadDrop: "将课堂材料拖放到此处",
    uploadTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG",
    uploadUploading: "上传中…",
    uploadFailed: "上传失败",
    uploadReplace: "点击替换",
    dropClass: "将课堂材料拖放到此处",
    readerScanTitle: "阅读器正在扫描文档…",
    readerScanSub: "正在提取知识口袋。大约 15–30 秒。",
    readerPhases: ["阅读内容", "识别概念", "形成口袋"],
    truncatedTitle: "文档较长 — 我们使用了前面的部分。",
    truncatedSub: "建议上传较短的章节以获得最佳效果。",
    genMessages: ["正在阅读…", "正在适配…", "快好了…"],
    openClassStep: "可选：打开班级面板为某位学生获取个性化建议",
    readingFile: "正在读取文件…",
    bestFor: "最适合",
    bestForAll: "最适合全班",
    concepts: "概念口袋",
    couldNotFinish: "无法完成",
    backToSelection: "← 返回选择",
  },
};

const TA: ExtraUiCopy = {
  student: {
    readerScanTitle: "வாசகர் முகவர் உங்கள் ஆவணத்தை ஸ்கேன் செய்கிறது…",
    readerScanSub: "அறிவு பாக்கெட்டுகளைப் பிரித்தெடுக்கிறது. சுமார் 15–30 வினாடிகள்.",
    readerPhases: ["உள்ளடக்கம் வாசிப்பு", "கருத்துக்களை அடையாளம்", "பாக்கெட்டுகள் உருவாக்கம்"],
    ilmFormatHint: "சுருக்கம் அல்லது வினாடி வினா வேண்டுமா? Ilm (வலது கீழ்) திறந்து செயல்களைப் பயன்படுத்துங்கள்.",
    truncatedTitle: "ஆவணம் நீளமாக இருந்தது — முதல் பகுதியைப் பயன்படுத்தினோம்.",
    truncatedSub: "சிறந்த முடிவுக்கு குறுகிய பகுதிகளைப் பதிவேற்றுங்கள்.",
    genMessages: ["ஆவணம் வாசிக்கிறது…", "கற்றல் பாணிக்கு மாற்றுகிறது…", "கிட்டத்தட்ட தயார்…"],
    journeyHint: "முதன்மை பகுதியில் வடிவத்தைத் தேர்ந்தெடுங்கள். விரைவு recap/quiz-க்கு Ilm (✦) பயன்படுத்துங்கள்.",
    couldNotFinish: "Could not finish",
    backToSelection: "← Back to selection",
  },
  educator: {
    step1: "1 · பதிவேற்றம்",
    step2: "2 · பதிவேற்றம்",
    step3: "3 · வடிவம் தேர்வு",
    step4: "4 · உங்கள் ஸ்லைடுகள்",
    step4Slides: "4 · உங்கள் ஸ்லைடுகள்",
    pickFormat: "3 · வடிவம் தேர்வு",
    uploadTitle: "2 · பதிவேற்றம்",
    uploadDrop: "வகுப்புப் பொருளை இங்கே விடுங்கள்",
    uploadTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG",
    uploadUploading: "பதிவேற்றுகிறது…",
    uploadFailed: "பதிவேற்றம் தோல்வி",
    uploadReplace: "மாற்ற கிளிக் செய்யுங்கள்",
    dropClass: "வகுப்புப் பொருளை இங்கே விடுங்கள்",
    readerScanTitle: "வாசகர் முகவர் ஆவணத்தை ஸ்கேன் செய்கிறது…",
    readerScanSub: "அறிவு பாக்கெட்டுகளைப் பிரித்தெடுக்கிறது.",
    readerPhases: ["வாசிப்பு", "கருத்துக்கள்", "பாக்கெட்டுகள்"],
    truncatedTitle: "ஆவணம் நீளமாக இருந்தது — முதல் பகுதி பயன்படுத்தப்பட்டது.",
    truncatedSub: "குறுகிய பகுதிகளைப் பதிவேற்றுங்கள்.",
    genMessages: ["வாசிக்கிறது…", "மாற்றுகிறது…", "கிட்டத்தட்ட தயார்…"],
    openClassStep: "Optional: வகுப்பு panel — தனிப்பட்ட பரிந்துரைக்கு மாணவர்",
    readingFile: "கோப்பு வாசிக்கிறது…",
    bestFor: "சிறந்தது",
    bestForAll: "முழு வகுப்புக்கு சிறந்தது",
    concepts: "கருத்து பாக்கெட்டுகள்",
    couldNotFinish: "Could not finish",
    backToSelection: "← Back to selection",
  },
};

const ROJAK: ExtraUiCopy = {
  student: {
    readerScanTitle: "Reader Agent tengah scan dokumen you…",
    readerScanSub: "Extract knowledge pockets — about 15–30 seconds je.",
    readerPhases: ["Reading content", "Find concepts", "Form pockets"],
    ilmFormatHint: "Nak summary or quiz? Open Ilm (bottom right) for actions — not chat only.",
    truncatedTitle: "Doc panjang — we guna first part je.",
    truncatedSub: "Best results: upload shorter sections lah.",
    genMessages: ["Reading doc…", "Adapting for your style…", "Almost ready…"],
    journeyHint: "Pick format in main area. Quick recap/quiz — guna Ilm (✦) on the right.",
    couldNotFinish: "Could not finish",
    backToSelection: "← Back to selection",
  },
  educator: {
    step1: "1 · Upload",
    step2: "2 · Upload",
    step3: "3 · Pick format",
    step4: "4 · Your slides",
    step4Slides: "4 · Your slides",
    pickFormat: "3 · Pick format",
    uploadTitle: "2 · Upload",
    uploadDrop: "Drop class material sini",
    uploadTypes: "PDF · DOCX · MP3 · WAV · JPG · PNG",
    uploadUploading: "Uploading…",
    uploadFailed: "Upload failed",
    uploadReplace: "Click to replace",
    dropClass: "Drop class material sini",
    readerScanTitle: "Reader Agent tengah scan dokumen…",
    readerScanSub: "Extracting pockets — 15–30 sec je.",
    readerPhases: ["Reading", "Find concepts", "Form pockets"],
    truncatedTitle: "Doc panjang — we guna first part.",
    truncatedSub: "Try shorter sections for best results lah.",
    genMessages: ["Reading…", "Adapting…", "Almost ready…"],
    openClassStep: "Optional: open class panel for personal student tips",
    readingFile: "Reading file…",
    bestFor: "Best for",
    bestForAll: "Best for whole class",
    concepts: "Concept pockets",
    couldNotFinish: "Could not finish",
    backToSelection: "← Back to selection",
  },
};

export const EXTRA_COPY: Record<Language, ExtraUiCopy> = {
  en: EN,
  ms: MS,
  zh: ZH,
  ta: TA,
  rojak: ROJAK,
};
