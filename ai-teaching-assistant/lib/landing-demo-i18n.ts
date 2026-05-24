import type { Language } from "@/lib/api";
import type { LandingDemoTopic } from "@/lib/landing-demo-topics";

type DemoFields = Pick<
  LandingDemoTopic,
  | "topic"
  | "topicMs"
  | "original"
  | "focusHeadline"
  | "focusSteps"
  | "flowSteps"
  | "exampleEn"
  | "exampleBm"
  | "exampleLocal"
>;

export type DemoUiCopy = {
  newTopicHint: string;
  anotherTopic: string;
  wallOfText: string;
  wallHint: string;
  mindMapHint: string;
  realLife: string;
  inAppSuffix: string;
  compareColumns: { id: string; label: string; tag: string }[];
};

const DEMO_UI: Record<Language, DemoUiCopy> = {
  en: {
    newTopicHint: "New topic each visit",
    anotherTopic: "↻ Another topic",
    wallOfText: "Wall of text",
    wallHint: "Hard to scan · easy to zone out",
    mindMapHint: "Same as Visual Mind Map in Student Step 3",
    realLife: "Real life:",
    inAppSuffix: "in app",
    compareColumns: [
      { id: "original", label: "Original PDF", tag: "Before ilm.io" },
      { id: "adhd", label: "Focus Slides", tag: "Same as Student Step 3" },
      { id: "mindmap", label: "Visual Mind Map", tag: "Same as Student Step 3" },
      { id: "dyslexia", label: "Easy Read + 🇲🇾 examples", tag: "Slides + local analogies" },
    ],
  },
  ms: {
    newTopicHint: "Topik baru setiap lawatan",
    anotherTopic: "↻ Topik lain",
    wallOfText: "Dinding teks",
    wallHint: "Sukar imbas · mudah hilang fokus",
    mindMapHint: "Sama seperti Peta Minda Visual dalam Langkah 3 Pelajar",
    realLife: "Kehidupan sebenar:",
    inAppSuffix: "dalam app",
    compareColumns: [
      { id: "original", label: "PDF Asal", tag: "Sebelum ilm.io" },
      { id: "adhd", label: "Slaid Fokus", tag: "Sama seperti Langkah 3 Pelajar" },
      { id: "mindmap", label: "Peta Minda Visual", tag: "Sama seperti Langkah 3 Pelajar" },
      { id: "dyslexia", label: "Baca Mudah + 🇲🇾 contoh", tag: "Slaid + analogi tempatan" },
    ],
  },
  zh: {
    newTopicHint: "每次访问新主题",
    anotherTopic: "↻ 换一个主题",
    wallOfText: "文字墙",
    wallHint: "难以浏览 · 容易走神",
    mindMapHint: "与学生第 3 步「视觉思维导图」相同",
    realLife: "生活例子：",
    inAppSuffix: "在应用中",
    compareColumns: [
      { id: "original", label: "原始 PDF", tag: "使用 ilm.io 之前" },
      { id: "adhd", label: "专注幻灯片", tag: "与学生第 3 步相同" },
      { id: "mindmap", label: "视觉思维导图", tag: "与学生第 3 步相同" },
      { id: "dyslexia", label: "易读 + 🇲🇾 例子", tag: "幻灯片 + 本地类比" },
    ],
  },
  ta: {
    newTopicHint: "ஒவ்வொரு வருகையும் புதிய தலைப்பு",
    anotherTopic: "↻ வேறு தலைப்பு",
    wallOfText: "உரை சுவர்",
    wallHint: "ஸ்கேன் செய்ய கடினம் · கவனம் சிதறும்",
    mindMapHint: "மாணவர் படி 3 இல் Visual Mind Map போல",
    realLife: "உண்மை வாழ்க்கை:",
    inAppSuffix: "app-இல்",
    compareColumns: [
      { id: "original", label: "அசல் PDF", tag: "ilm.io-க்கு முன்" },
      { id: "adhd", label: "Focus Slides", tag: "மாணவர் படி 3 போல" },
      { id: "mindmap", label: "Visual Mind Map", tag: "மாணவர் படி 3 போல" },
      { id: "dyslexia", label: "Easy Read + 🇲🇾", tag: "Slides + local analogies" },
    ],
  },
  rojak: {
    ...{} as DemoUiCopy,
  },
};
DEMO_UI.rojak = { ...DEMO_UI.en, anotherTopic: "↻ Another topic lah" };

const TOPIC_I18N: Record<string, Partial<Record<Language, DemoFields>>> = {
  "water-cycle": {
    zh: {
      topic: "水循环",
      topicMs: "Kitaran Air",
      original:
        "水循环描述水在地球表面、上方和下方不断移动，包括蒸发、凝结、降水、渗透和径流，由太阳辐射和重力驱动。",
      focusHeadline: "水在一个循环中流动。",
      focusSteps: ["太阳加热水 → 上升为水蒸气", "形成云 → 下雨", "水流入河流和海洋 → 再次蒸发"],
      flowSteps: [
        { icon: "☀️", label: "蒸发" },
        { icon: "☁️", label: "云" },
        { icon: "🌧️", label: "雨" },
        { icon: "🌊", label: "河流与海洋" },
      ],
      exampleEn: "Like water in a kettle — heat turns it to steam, then it cools and drips back.",
      exampleBm: "Macam air dalam cerek — haba jadi wap, sejuk jadi titisan balik.",
      exampleLocal: "Hujan di KL selepas panas tengah hari — air naik, jatuh, ulang lagi.",
    },
    ms: {
      topic: "Kitaran Air",
      topicMs: "Kitaran Air",
      original:
        "Kitaran hidrologi menerangkan pergerakan air yang berterusan di permukaan, atas, dan bawah bumi melalui penyejukan, pemendapan, hujan, infiltrasi, dan aliran.",
      focusHeadline: "Air bergerak dalam gelung.",
      focusSteps: ["Matahari panaskan air → naik sebagai wap", "Awan terbentuk → hujan turun", "Air masuk sungai → evaporasi semula"],
      flowSteps: [
        { icon: "☀️", label: "Evaporasi" },
        { icon: "☁️", label: "Awan" },
        { icon: "🌧️", label: "Hujan" },
        { icon: "🌊", label: "Sungai" },
      ],
      exampleEn: "Like water in a kettle — heat turns it to steam, then it cools and drips back.",
      exampleBm: "Macam air dalam cerek — haba jadi wap, sejuk jadi titisan balik.",
      exampleLocal: "Hujan di KL selepas panas tengah hari — air naik, jatuh, ulang lagi.",
    },
  },
  photosynthesis: {
    zh: {
      topic: "光合作用",
      topicMs: "Fotosintesis",
      original: "光合作用是植物利用叶绿体中的光能将二氧化碳和水转化为葡萄糖并释放氧气的过程。",
      focusHeadline: "植物用阳光制造食物。",
      focusSteps: ["阳光照到叶子 → 吸收能量", "水分解 → 释放氧气", "逐步合成糖分"],
      flowSteps: [
        { icon: "☀️", label: "阳光" },
        { icon: "🌿", label: "叶子" },
        { icon: "💧", label: "水 + 二氧化碳" },
        { icon: "🍬", label: "糖 + 氧气" },
      ],
      exampleEn: "Like a solar panel on a leaf — sunlight in, food stored.",
      exampleBm: "Macam panel solar pada daun — cahaya masuk, makanan disimpan.",
      exampleLocal: "昨天的 kangkung 靠今天的阳光获得能量。",
    },
    ms: {
      topic: "Fotosintesis",
      topicMs: "Fotosintesis",
      original:
        "Fotosintesis ialah proses tumbuhan menukar tenaga cahaya kepada tenaga kimia dalam glukosa melalui kloroplas.",
      focusHeadline: "Tumbuhan buat makanan dari cahaya matahari.",
      focusSteps: ["Cahaya ke daun → tenaga ditangkap", "Air terurai → oksigen bebas", "Gula dibina langkah demi langkah"],
      flowSteps: [
        { icon: "☀️", label: "Cahaya matahari" },
        { icon: "🌿", label: "Daun" },
        { icon: "💧", label: "Air + CO₂" },
        { icon: "🍬", label: "Gula + O₂" },
      ],
      exampleEn: "Like a solar panel on a leaf — sunlight in, food stored.",
      exampleBm: "Macam panel solar pada daun — cahaya masuk, makanan disimpan.",
      exampleLocal: "Kangkung dalam lauk semalam dapat tenaga dari matahari hari ini.",
    },
  },
  fractions: {
    zh: {
      topic: "分数",
      topicMs: "Pecahan",
      original: "分数表示整体的一部分。分子告诉我们有多少份，分母告诉我们总共分成多少份。",
      focusHeadline: "分数就是「一部分」。",
      focusSteps: ["看分母 → 总共几份", "看分子 → 拿了几份", "画饼图帮助理解"],
      flowSteps: [
        { icon: "🍕", label: "整体" },
        { icon: "✂️", label: "分割" },
        { icon: "🔢", label: "分子/分母" },
        { icon: "✓", label: "比较大小" },
      ],
      exampleEn: "Half a pizza = 1/2 — one slice out of two equal parts.",
      exampleBm: "Separuh pizza = 1/2 — satu keping daripada dua bahagian sama.",
      exampleLocal: "Nasi lemak 剩一半 — 就是 1/2。",
    },
  },
  monsoon: {
    zh: {
      topic: "季风",
      topicMs: "Monsun",
      original: "季风是随季节改变方向的风，为东南亚带来丰沛的雨季和较干的旱季。",
      focusHeadline: "风随季节转向。",
      focusSteps: ["夏季：海风带来雨水", "冬季：陆风较干燥", "影响农业与洪水"],
      flowSteps: [
        { icon: "🌬️", label: "风向" },
        { icon: "🌧️", label: "雨季" },
        { icon: "☀️", label: "旱季" },
        { icon: "🌾", label: "农业" },
      ],
      exampleEn: "Like switching fans — one season blows wet air inland, another blows dry.",
      exampleBm: "Macam kipas bertukar — satu musim tiup udara basah, satu lagi kering.",
      exampleLocal: "Musim tengkujuh di Pantai Timur — hujan lebat, sungai naik.",
    },
  },
  electricity: {
    zh: {
      topic: "电路",
      topicMs: "Elektrik",
      original: "简单电路需要电源、导线和负载。电流从电源流出，经过负载，再流回形成完整回路。",
      focusHeadline: "电需要完整回路。",
      focusSteps: ["电池提供能量", "导线连接各部件", "开关控制通断"],
      flowSteps: [
        { icon: "🔋", label: "电源" },
        { icon: "➖", label: "导线" },
        { icon: "💡", label: "灯泡" },
        { icon: "🔄", label: "回路" },
      ],
      exampleEn: "Like water in a closed pipe — it only flows when the loop is complete.",
      exampleBm: "Macam air dalam paip tertutup — mengalir bila gelung lengkap.",
      exampleLocal: "Lampu Raya — satu mentol rosak, yang lain masih terang (litar selari).",
    },
  },
  heart: {
    zh: {
      topic: "心脏",
      topicMs: "Jantung",
      original: "心脏通过收缩和舒张将血液泵送到全身，为细胞输送氧气和营养。",
      focusHeadline: "心脏是身体的泵。",
      focusSteps: ["心房接收血液", "心室强力泵出", "动脉送氧，静脉回流"],
      flowSteps: [
        { icon: "❤️", label: "心脏" },
        { icon: "🫁", label: "肺部" },
        { icon: "🦵", label: "全身" },
        { icon: "🔄", label: "循环" },
      ],
      exampleEn: "Like a hand pump — squeeze pushes water out, release pulls more in.",
      exampleBm: "Macam pam tangan — tekan tolak keluar, lepas tarik masuk.",
      exampleLocal: "Selepas berlari — jantung berdegup laju untuk hantar oksigen.",
    },
  },
  malacca: {
    zh: {
      topic: "马六甲历史",
      topicMs: "Sejarah Melaka",
      original: "马六甲曾是重要的贸易港口，连接东西方商路，也是马来苏丹国的中心。",
      focusHeadline: "马六甲连接世界贸易。",
      focusSteps: ["港口位置优越", "香料与丝绸贸易", "多元文化交汇"],
      flowSteps: [
        { icon: "⚓", label: "港口" },
        { icon: "🚢", label: "贸易" },
        { icon: "👑", label: "苏丹" },
        { icon: "🕌", label: "文化" },
      ],
      exampleEn: "Like today's KL airport — a hub where routes meet.",
      exampleBm: "Macam lapangan terbang KL hari ini — hab laluan bertemu.",
      exampleLocal: "Jonker Street — warisan pedagang Cina, Melayu, India.",
    },
  },
  nutrition: {
    zh: {
      topic: "营养",
      topicMs: "Pemakanan",
      original: "均衡饮食包含碳水化合物、蛋白质、脂肪、维生素和矿物质，为身体和大脑提供能量。",
      focusHeadline: "不同食物有不同作用。",
      focusSteps: ["碳水 → 能量", "蛋白质 → 修复肌肉", "蔬果 → 维生素"],
      flowSteps: [
        { icon: "🍚", label: "碳水" },
        { icon: "🥚", label: "蛋白质" },
        { icon: "🥦", label: "维生素" },
        { icon: "💧", label: "水" },
      ],
      exampleEn: "Like a football team — each player has a role, all needed to win.",
      exampleBm: "Macam pasukan bola — setiap pemain ada peranan, semua perlu menang.",
      exampleLocal: "Nasi lemak — nasi (tenaga), telur (protein), sambal (rasa + sayur).",
    },
  },
};

export function getDemoUiStrings(lang: Language): DemoUiCopy {
  return DEMO_UI[lang] ?? DEMO_UI.en;
}

export function localizeDemoTopic(topic: LandingDemoTopic, lang: Language): LandingDemoTopic {
  const pack = TOPIC_I18N[topic.id]?.[lang];
  if (!pack) return topic;
  return { ...topic, ...pack };
}

export type ProfileOptionCopy = {
  conditions: { key: string; label: string }[];
  paces: { key: string; label: string }[];
  minSuffix: string;
};

const PROFILE_OPTS: Record<Language, ProfileOptionCopy> = {
  en: {
    conditions: [
      { key: "adhd", label: "ADHD" },
      { key: "dyslexia", label: "Dyslexia" },
      { key: "autism", label: "Autism" },
      { key: "mixed", label: "Mixed" },
    ],
    paces: [
      { key: "quick", label: "Quick bursts" },
      { key: "steady", label: "Steady blocks" },
      { key: "flexible", label: "Flexible" },
    ],
    minSuffix: "min",
  },
  ms: {
    conditions: [
      { key: "adhd", label: "ADHD" },
      { key: "dyslexia", label: "Disleksia" },
      { key: "autism", label: "Autisme" },
      { key: "mixed", label: "Campuran" },
    ],
    paces: [
      { key: "quick", label: "Sesi pendek" },
      { key: "steady", label: "Blok stabil" },
      { key: "flexible", label: "Fleksibel" },
    ],
    minSuffix: "min",
  },
  zh: {
    conditions: [
      { key: "adhd", label: "ADHD" },
      { key: "dyslexia", label: "阅读障碍" },
      { key: "autism", label: "自闭症" },
      { key: "mixed", label: "混合" },
    ],
    paces: [
      { key: "quick", label: "短时段" },
      { key: "steady", label: "稳定块" },
      { key: "flexible", label: "灵活" },
    ],
    minSuffix: "分钟",
  },
  ta: {
    conditions: [
      { key: "adhd", label: "ADHD" },
      { key: "dyslexia", label: "Dyslexia" },
      { key: "autism", label: "Autism" },
      { key: "mixed", label: "Mixed" },
    ],
    paces: [
      { key: "quick", label: "Quick bursts" },
      { key: "steady", label: "Steady blocks" },
      { key: "flexible", label: "Flexible" },
    ],
    minSuffix: "min",
  },
  rojak: {
    conditions: [
      { key: "adhd", label: "ADHD" },
      { key: "dyslexia", label: "Dyslexia" },
      { key: "autism", label: "Autism" },
      { key: "mixed", label: "Mixed" },
    ],
    paces: [
      { key: "quick", label: "Quick bursts" },
      { key: "steady", label: "Steady blocks lah" },
      { key: "flexible", label: "Flexible" },
    ],
    minSuffix: "min",
  },
};

export function getProfileOptions(lang: Language): ProfileOptionCopy {
  return PROFILE_OPTS[lang] ?? PROFILE_OPTS.en;
}

const BLOCK_MINS = {
  high: [25, 5, 20],
  steady: [15, 10, 15],
  low: [10, 5, 10],
} as const;

export function getEnergyBlocks(lang: Language, energy: number) {
  const L = {
    en: { high: "High focus", steady: "Steady", low: "Low energy — gentle mode" },
    ms: { high: "Fokus tinggi", steady: "Stabil", low: "Tenaga rendah — mod lembut" },
    zh: { high: "高专注", steady: "稳定", low: "低精力 — 温和模式" },
    ta: { high: "உயர் கவனம்", steady: "நிலையான", low: "குறைந்த ஆற்றல்" },
    rojak: { high: "High focus", steady: "Steady lah", low: "Low energy — chill mode" },
  }[lang] ?? { high: "High focus", steady: "Steady", low: "Low energy — gentle mode" };

  const blocks = {
    en: {
      high: ["Focus slides — one concept", "Stretch break", "Practice questions"],
      steady: ["Easy-read slides", "Mind map review", "Ilm summarize + quiz"],
      low: ["Listen — short audio script", "Rest — no screens", "3 vocab words only"],
    },
    ms: {
      high: ["Slaid fokus — satu konsep", "Rehat regangan", "Soalan latihan"],
      steady: ["Slaid baca mudah", "Semak peta minda", "Ringkasan Ilm + kuiz"],
      low: ["Dengar — skrip audio pendek", "Rehat — tiada skrin", "3 perkataan vocab sahaja"],
    },
    zh: {
      high: ["专注幻灯片 — 一个概念", "伸展休息", "练习题"],
      steady: ["易读幻灯片", "思维导图复习", "Ilm 总结 + 测验"],
      low: ["听 — 短音频脚本", "休息 — 不看屏幕", "只学 3 个词汇"],
    },
    ta: {
      high: ["Focus slides — one concept", "Stretch break", "Practice questions"],
      steady: ["Easy-read slides", "Mind map review", "Ilm summarize + quiz"],
      low: ["Listen — audio script", "Rest — no screens", "3 vocab words"],
    },
    rojak: {
      high: ["Focus slides — one concept", "Stretch break", "Practice Qs"],
      steady: ["Easy-read slides", "Mind map review", "Ilm summarize + quiz"],
      low: ["Listen — audio script", "Rest — no screens", "3 vocab words je"],
    },
  }[lang] ?? {
    high: ["Focus slides — one concept", "Stretch break", "Practice questions"],
    steady: ["Easy-read slides", "Mind map review", "Ilm summarize + quiz"],
    low: ["Listen — short audio script", "Rest — no screens", "3 vocab words only"],
  };

  const colors = {
    high: ["bg-dust-lo border-dust", "bg-sand border-sand-mid", "bg-sage-lo border-sage"],
    steady: ["bg-[#E8F4FD] border-[#1A5C96]", "bg-terra-lo border-terra", "bg-sage-lo border-sage"],
    low: ["bg-sage-lo border-sage", "bg-sand border-sand-mid", "bg-honey-lo border-honey"],
  };

  const tier = energy >= 75 ? "high" : energy >= 45 ? "steady" : "low";
  const label = L[tier];
  const tasks = blocks[tier];
  const mins = BLOCK_MINS[tier];
  const minSuffix = getProfileOptions(lang).minSuffix;

  return {
    label,
    studyBlocks: tasks.map((task, i) => ({
      task,
      min: mins[i],
      color: colors[tier][i],
      minLabel: `${mins[i]} ${minSuffix}`,
    })),
  };
}
