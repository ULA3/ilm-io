import { slideImageUrl } from "@/lib/slide-visual";

export type LandingDemoTopic = {
  id: string;
  topic: string;
  topicMs: string;
  emoji: string;
  original: string;
  focusHeadline: string;
  focusSteps: string[];
  flowSteps: { icon: string; label: string }[];
  exampleEn: string;
  exampleBm: string;
  exampleLocal: string;
  images: {
    hero: string;
    original: string;
    focus: string;
    visual: string;
    local: string;
  };
};

function topicImages(
  prompt: string,
  title: string,
  subject: string,
  extras?: Partial<LandingDemoTopic["images"]>
): LandingDemoTopic["images"] {
  return {
    hero: slideImageUrl(`${prompt} colorful educational illustration simple`, title, subject),
    original: extras?.original ?? slideImageUrl(`${prompt} textbook detail`, title, subject),
    focus: slideImageUrl(`${prompt} simple three steps diagram icons`, title, subject),
    visual: extras?.visual ?? slideImageUrl(`${prompt} flowchart diagram arrows`, title, subject),
    local: slideImageUrl(`malaysian ${prompt} daily life friendly`, title, subject),
  };
}

export const LANDING_DEMO_TOPICS: LandingDemoTopic[] = [
  {
    id: "photosynthesis",
    topic: "Photosynthesis",
    topicMs: "Fotosintesis",
    emoji: "🌿",
    original:
      "Photosynthesis is the biochemical process whereby autotrophic organisms convert light energy into chemical energy stored in glucose through the Calvin cycle and light-dependent reactions in chloroplasts.",
    focusHeadline: "Plants make food from sunlight.",
    focusSteps: [
      "Light hits leaves → energy captured",
      "Water splits → oxygen released",
      "Sugar built step by step",
    ],
    flowSteps: [
      { icon: "☀️", label: "Sunlight" },
      { icon: "🌿", label: "Leaf" },
      { icon: "💧", label: "Water + CO₂" },
      { icon: "🍬", label: "Sugar + O₂" },
    ],
    exampleEn: "Like a solar panel on a leaf — sunlight in, food stored.",
    exampleBm: "Macam panel solar pada daun — cahaya masuk, makanan disimpan.",
    exampleLocal: "Kangkung dalam lauk semalam dapat tenaga dari matahari hari ini.",
    images: {
      ...topicImages("photosynthesis leaf chloroplast", "Photosynthesis", "Biology"),
      original:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Chloroplast_new.jpg/400px-Chloroplast_new.jpg",
      visual:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Photosynthesis.gif/320px-Photosynthesis.gif",
      local:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Ipomoea_aquatica.jpg/400px-Ipomoea_aquatica.jpg",
    },
  },
  {
    id: "water-cycle",
    topic: "The Water Cycle",
    topicMs: "Kitaran Air",
    emoji: "💧",
    original:
      "The hydrologic cycle describes the continuous movement of water on, above, and below the surface of the Earth through processes of evaporation, condensation, precipitation, infiltration, and runoff driven by solar radiation and gravitational potential energy.",
    focusHeadline: "Water travels in a loop.",
    focusSteps: [
      "Sun heats water → it rises as vapour",
      "Clouds form → rain falls",
      "Rain fills rivers and seas → repeat",
    ],
    flowSteps: [
      { icon: "☀️", label: "Evaporation" },
      { icon: "☁️", label: "Clouds" },
      { icon: "🌧️", label: "Rain" },
      { icon: "🌊", label: "Rivers & sea" },
    ],
    exampleEn: "Like water in a kettle — heat up, cloud above, drip back down.",
    exampleBm: "Macam air dalam cerek — panas, wap naik, hujan turun balik.",
    exampleLocal: "Selepas hujan monsun, longkang penuh — sama kitaran, skala kecil.",
    images: topicImages("water cycle evaporation rain clouds", "Water Cycle", "Geography"),
  },
  {
    id: "fractions",
    topic: "Fractions",
    topicMs: "Pecahan",
    emoji: "🔢",
    original:
      "A fraction represents a rational number expressing the ratio of two integers a/b where b ≠ 0, indicating the quotient of the numerator divided by the denominator within the real number system.",
    focusHeadline: "A fraction is a fair share.",
    focusSteps: [
      "Top number = pieces you have",
      "Bottom number = equal parts in total",
      "½ means one piece out of two",
    ],
    flowSteps: [
      { icon: "🍕", label: "Whole" },
      { icon: "✂️", label: "Split equal" },
      { icon: "1️⃣", label: "Take some" },
      { icon: "🔢", label: "Write a/b" },
    ],
    exampleEn: "Like sharing nasi lemak — 1 pack split among 4 friends = ¼ each.",
    exampleBm: "Macam kongsi nasi lemak — 1 bungkus, 4 kawan = ¼ seorang.",
    exampleLocal: "RM10 kongsi 5 orang — setiap orang dapat RM2 (⅕… atau faham RM2 je).",
    images: topicImages("fractions pizza slices math equal parts", "Fractions", "Mathematics"),
  },
  {
    id: "monsoon",
    topic: "Monsoon Winds",
    topicMs: "Angin Monsun",
    emoji: "🌧️",
    original:
      "Monsoons are large-scale seasonal wind systems reversing direction between summer and winter due to differential heating of land and ocean masses, governing precipitation patterns across South and Southeast Asia.",
    focusHeadline: "Winds flip with the seasons.",
    focusSteps: [
      "Land heats faster than sea",
      "Wet season brings heavy rain",
      "Dry season brings less rain",
    ],
    flowSteps: [
      { icon: "🏝️", label: "Hot land" },
      { icon: "💨", label: "Wind shift" },
      { icon: "🌧️", label: "Wet monsoon" },
      { icon: "☀️", label: "Dry spell" },
    ],
    exampleEn: "Like a fan pointing different ways — wet months vs dry months.",
    exampleBm: "Macam kipas halau angin — musim hujan vs musim kering.",
    exampleLocal: "Nov–Mac di Pantai Timur — hujan setiap petang, bawa payung ke sekolah.",
    images: topicImages("monsoon rain malaysia clouds wind", "Monsoon", "Geography"),
  },
  {
    id: "electricity",
    topic: "Simple Circuits",
    topicMs: "Litar Elektrik",
    emoji: "⚡",
    original:
      "An electric circuit is a closed conductive path enabling the flow of charge carriers under the influence of an electromotive force, governed by Ohm's law relating voltage, current, and resistance in series and parallel configurations.",
    focusHeadline: "Electricity needs a full loop.",
    focusSteps: [
      "Battery pushes charge",
      "Wires carry it around",
      "Bulb lights when loop is closed",
    ],
    flowSteps: [
      { icon: "🔋", label: "Battery" },
      { icon: "➡️", label: "Wire" },
      { icon: "💡", label: "Bulb" },
      { icon: "🔄", label: "Back to start" },
    ],
    exampleEn: "Like a one-way running track — runners must complete the loop.",
    exampleBm: "Macam trek larian pusingan — mesti habis pusingan baru lengkap.",
    exampleLocal: "Torchlight mati bila wayar longgar — litar terbuka, arus tak flow.",
    images: topicImages("simple electric circuit bulb battery wire", "Circuits", "Physics"),
  },
  {
    id: "heart",
    topic: "The Human Heart",
    topicMs: "Jantung Manusia",
    emoji: "🫀",
    original:
      "The heart is a muscular organ comprising four chambers that cyclically contract and relax to pump oxygenated and deoxygenated blood through pulmonary and systemic circulatory pathways via valves preventing regurgitation.",
    focusHeadline: "Your heart is a double pump.",
    focusSteps: [
      "Right side → lungs (get oxygen)",
      "Left side → body (send oxygen)",
      "Lub-dub = valves closing",
    ],
    flowSteps: [
      { icon: "🫀", label: "Heart" },
      { icon: "🫁", label: "Lungs" },
      { icon: "🩸", label: "Blood" },
      { icon: "💪", label: "Muscles" },
    ],
    exampleEn: "Like a delivery rider with two routes — pick up O₂, drop to body.",
    exampleBm: "Macam rider dua laluan — ambil oksigen, hantar ke badan.",
    exampleLocal: "Selepas joging, jantung laju — badan minta lebih oksigen.",
    images: {
      ...topicImages("human heart blood circulation simple", "Heart", "Biology"),
      original:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Diagram_of_the_human_heart_%28cropped%29.svg/320px-Diagram_of_the_human_heart_%28cropped%29.svg.png",
    },
  },
  {
    id: "malacca",
    topic: "Malacca Sultanate",
    topicMs: "Kesultanan Melaka",
    emoji: "🏛️",
    original:
      "The Malacca Sultanate (1400–1511) emerged as a dominant maritime entrepôt controlling the Strait of Malacca, facilitating Islamization, tributary trade with Ming China, and regional political consolidation prior to Portuguese conquest.",
    focusHeadline: "Melaka was a trading superhub.",
    focusSteps: [
      "Port between India & China",
      "Spices & goods exchanged",
      "Islam spread through trade",
    ],
    flowSteps: [
      { icon: "⛵", label: "Ships arrive" },
      { icon: "🏪", label: "Market trade" },
      { icon: "🕌", label: "Culture mix" },
      { icon: "🗺️", label: "Power grows" },
    ],
    exampleEn: "Like today's KLIA — everyone meets, swaps goods and ideas.",
    exampleBm: "Macam hub lapangan terbang — bertemu, berniaga, kongsi budaya.",
    exampleLocal: "Jonker Walk hari ini — warisan bazaar Melaka lama.",
    images: topicImages("malacca sultanate port ships history", "Malacca", "History"),
  },
  {
    id: "nutrition",
    topic: "Balanced Diet",
    topicMs: "Diet Seimbang",
    emoji: "🍎",
    original:
      "Nutritional science categorizes dietary requirements into macronutrients and micronutrients whose proportional intake supports metabolic homeostasis, growth, and disease prevention according to food pyramid guidelines.",
    focusHeadline: "Eat a mix every day.",
    focusSteps: [
      "Grains give energy",
      "Protein builds body",
      "Fruits & veggies give vitamins",
    ],
    flowSteps: [
      { icon: "🍚", label: "Carbs" },
      { icon: "🍗", label: "Protein" },
      { icon: "🥦", label: "Veggies" },
      { icon: "🍉", label: "Fruit" },
    ],
    exampleEn: "Like a plate with quarters — not all rice, not all fried chicken.",
    exampleBm: "Macam pinggan suku-suku — sikit nasi, protein, sayur, buah.",
    exampleLocal: "Nasi campur di kedai — pilih sayur + ikan, kurang kuah berlemak.",
    images: topicImages("balanced diet food pyramid healthy plate", "Nutrition", "Health"),
  },
];

/** New random topic on each call — use once per page mount */
export function pickRandomLandingTopic(): LandingDemoTopic {
  const i = Math.floor(Math.random() * LANDING_DEMO_TOPICS.length);
  return LANDING_DEMO_TOPICS[i];
}

export function pickAnotherLandingTopic(currentId: string): LandingDemoTopic {
  const pool = LANDING_DEMO_TOPICS.filter((t) => t.id !== currentId);
  if (pool.length === 0) return pickRandomLandingTopic();
  return pool[Math.floor(Math.random() * pool.length)];
}
