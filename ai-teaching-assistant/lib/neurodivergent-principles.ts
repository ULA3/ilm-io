/**
 * Design principles grounded in neurodiversity + online learning research.
 * Sources: PMC focus-group study on cognitive load (2024); MDPI extraneous load study;
 * W3C COGA usable content; Education Northwest neuro-inclusive digital learning.
 */

export type ResearchPrinciple = {
  id: string;
  title: string;
  body: string;
  appliesTo: string[];
};

export const RESEARCH_PRINCIPLES: ResearchPrinciple[] = [
  {
    id: "chunk",
    title: "One idea at a time",
    body: "Break content into small chunks with clear headings. Neurodivergent learners report higher overload when walls of text and unclear structure compete for attention.",
    appliesTo: ["Focus Slides", "Easy Read Slides"],
  },
  {
    id: "predictable",
    title: "Same layout every slide",
    body: "Predictable What → Details → Why patterns reduce anxiety and navigation cost — especially helpful for autistic learners.",
    appliesTo: ["Clear & Calm Slides"],
  },
  {
    id: "multimodal",
    title: "Show, don’t only tell",
    body: "Icons, colour cues, diagrams, and audio lower extraneous cognitive load when text alone is hard to parse (dyslexia, ADHD).",
    appliesTo: ["Visual Mind Map", "Slide images", "Listen mode"],
  },
  {
    id: "control",
    title: "You control pace & senses",
    body: "No surprise autoplay, timers you can see, reduce-motion, dyslexia font, and mood-based study plans — learner agency matters.",
    appliesTo: ["Side dock", "Mood check-in", "Energy slider"],
  },
  {
    id: "examples",
    title: "Real-life anchors",
    body: "Analogies and local examples (food, weather, school life) turn abstract facts into memory hooks.",
    appliesTo: ["Ilm chat", "Easy Read Slides", "Practice Questions"],
  },
];

export type MalaysiaFeature = {
  emoji: string;
  title: string;
  body: string;
};

/** What makes ilm.io relevant locally — not just translated English UI */
export const MALAYSIA_FEATURES: MalaysiaFeature[] = [
  {
    emoji: "🇲🇾",
    title: "4 languages, one brain",
    body: "English, Bahasa Melayu, 普通话, தமிழ் — slides and Ilm can switch so you study in the language you think in.",
  },
  {
    emoji: "🍜",
    title: "Examples that feel local",
    body: "Kangkung from your lunch plate, pasar tani, SPM revision — not only US textbook scenarios.",
  },
  {
    emoji: "🕌",
    title: "Calm, low-sensory option",
    body: "Reduce motion, no autoplay music, high contrast, and gentle mode when energy is low — fits hot, noisy, busy days.",
  },
  {
    emoji: "👩‍🏫",
    title: "Teachers see the class",
    body: "Educators pick a student profile (ADHD / dyslexia / autism) and get format tips — less guessing what helps.",
  },
];

export { STUDENT_OUTPUT_FORMATS } from "@/lib/ilm-formats";
