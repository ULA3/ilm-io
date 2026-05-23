"use client";

import { useState } from "react";
import Link from "next/link";

type TransformMode = "original" | "neuro" | "visual" | "examples";

const SAMPLE = {
  original:
    "Photosynthesis is the biochemical process whereby autotrophic organisms convert light energy into chemical energy stored in glucose through the Calvin cycle and light-dependent reactions in chloroplasts.",
  neuro:
    "Plants make food from sunlight.\n\n• Light hits leaves → energy captured\n• Water splits → oxygen released\n• Sugar built step by step\n\nOne big idea per line. Short sentences. No surprises.",
  visual:
    "☀️ Sunlight\n    ↓\n🌿 Chloroplast\n    ↓\n💧 + CO₂ → 🍬 Sugar + O₂\n\nColour-coded branches · mind-map style",
  examples:
    "Like a solar panel on a leaf — sunlight in, food stored.\n\nReal life: the spinach in your lunch got its energy from the sun yesterday.",
};

const PAIN_POINTS = [
  { emoji: "📄", title: "Dense PDFs", desc: "Walls of text cause overload before learning even starts." },
  { emoji: "⏱️", title: "Short focus", desc: "Long chapters don't match real attention spans." },
  { emoji: "🔤", title: "Reading friction", desc: "Fonts and layout weren't designed for dyslexia." },
  { emoji: "😰", title: "Unpredictable formats", desc: "Every teacher uses a different structure — hard to trust." },
];

const PROFILE_OPTS = {
  condition: ["ADHD", "Dyslexia", "Autism", "Mixed"],
  pace: ["Quick bursts", "Steady blocks", "Flexible"],
  format: ["Slides", "Visual map", "Practice Qs", "Easy read"],
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-sage-hi mb-2">{children}</p>
  );
}

function FloatingShapes() {
  const shapes = [
    { size: 200, top: "-5%", left: "-5%", color: "var(--c-sage-lo)", delay: "0s", dur: "18s" },
    { size: 140, top: "20%", right: "-3%", color: "var(--c-terra-lo)", delay: "4s", dur: "22s" },
    { size: 100, bottom: "15%", left: "8%", color: "var(--c-dust-lo)", delay: "2s", dur: "16s" },
  ];
  return (
    <div className="pointer-events-none select-none absolute inset-0 overflow-hidden" aria-hidden>
      {shapes.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-50"
          style={{
            width: s.size,
            height: s.size,
            top: s.top,
            left: s.left,
            right: "right" in s ? s.right : undefined,
            bottom: "bottom" in s ? s.bottom : undefined,
            backgroundColor: s.color,
            animation: `landingFloat ${s.dur} ease-in-out ${s.delay} infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export function LandingPage() {
  const [mode, setMode] = useState<TransformMode>("original");
  const [condition, setCondition] = useState("ADHD");
  const [pace, setPace] = useState("Quick bursts");
  const [format, setFormat] = useState("Slides");
  const [energy, setEnergy] = useState(65);
  const [accFont, setAccFont] = useState<"default" | "dyslexic">("default");
  const [accSize, setAccSize] = useState<"md" | "lg">("md");
  const [highContrast, setHighContrast] = useState(false);

  const energyLabel =
    energy >= 75 ? "High focus" : energy >= 45 ? "Steady" : "Low energy — gentle mode";

  const studyBlocks =
    energy >= 75
      ? [
          { min: 25, task: "Focus slides — one concept", color: "bg-dust-lo border-dust" },
          { min: 5, task: "Stretch break", color: "bg-sand border-sand-mid" },
          { min: 20, task: "Practice questions", color: "bg-sage-lo border-sage" },
        ]
      : energy >= 45
        ? [
            { min: 15, task: "Easy-read slides", color: "bg-[#E8F4FD] border-[#1A5C96]" },
            { min: 10, task: "Mind map review", color: "bg-terra-lo border-terra" },
            { min: 15, task: "Ilm summarize + quiz", color: "bg-sage-lo border-sage" },
          ]
        : [
            { min: 10, task: "Listen — short audio script", color: "bg-sage-lo border-sage" },
            { min: 5, task: "Rest — no screens", color: "bg-sand border-sand-mid" },
            { min: 10, task: "3 vocab words only", color: "bg-honey-lo border-honey" },
          ];

  const fingerprint = {
    visual: condition === "Autism" ? 72 : condition === "ADHD" ? 88 : 65,
    auditory: format.includes("audio") ? 80 : 45,
    structured: condition === "Autism" ? 92 : 55,
    interactive: format.includes("Practice") ? 85 : 60,
    calm: condition === "Dyslexia" ? 90 : 70,
  };

  return (
    <main className="min-h-screen bg-cream relative">
      <style>{`
        @keyframes landingFloat {
          from { transform: translateY(0) scale(1); }
          to { transform: translateY(-20px) scale(1.03); }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <FloatingShapes />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-sage rounded-2xl flex items-center justify-center shadow-md mb-3">
              <span className="text-white text-3xl font-bold">✦</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-serif text-3xl sm:text-4xl font-semibold text-bark-deep">ilm</span>
              <span className="text-bark-faint text-lg">.io</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-bark-deep leading-[1.12] mb-3">
            Learning your way.<br />
            <span className="text-sage">At your pace.</span>
            <br />
            In your language.
          </h1>
          <p className="text-bark-soft text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            An adaptive learning platform for neurodivergent learners — not a generic summarizer.
            Your notes become formats that match how your brain works.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link
              href="/student"
              className="px-6 py-3 bg-sage text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
            >
              Start as student
            </Link>
            <Link
              href="/educator"
              className="px-6 py-3 bg-parch border-2 border-terra text-terra-hi font-semibold rounded-2xl hover:bg-terra-lo transition-colors"
            >
              I&apos;m a teacher
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-16 sm:space-y-20">
        {/* 1 — Transformation demo */}
        <section aria-labelledby="transform-heading">
          <SectionLabel>See the difference</SectionLabel>
          <h2 id="transform-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-2">
            One note, four ways to learn it
          </h2>
          <p className="text-bark-soft text-sm mb-5 max-w-2xl">
            Same topic — transformed for focus, clarity, visuals, and real-life examples.
          </p>
          <div className="bg-parch rounded-3xl border border-sand-mid p-4 sm:p-5 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4" role="tablist">
              {(
                [
                  ["original", "Original"],
                  ["neuro", "Neuro-friendly"],
                  ["visual", "Visual mode"],
                  ["examples", "Examples mode"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => setMode(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mode === id
                      ? "bg-bark-deep text-white"
                      : "bg-sand text-bark-soft hover:text-bark-deep"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              className={`rounded-2xl p-4 sm:p-5 min-h-[140px] text-left whitespace-pre-line leading-relaxed ${
                mode === "original"
                  ? "bg-sand text-bark-soft text-sm"
                  : mode === "neuro"
                    ? "bg-sage-lo text-bark-deep text-base"
                    : mode === "visual"
                      ? "bg-terra-lo text-bark-deep font-mono text-sm"
                      : "bg-honey-lo text-bark-deep text-sm"
              }`}
            >
              {SAMPLE[mode]}
            </div>
          </div>
        </section>

        {/* 3 — Pain points */}
        <section aria-labelledby="pain-heading">
          <SectionLabel>Why we built this</SectionLabel>
          <h2 id="pain-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-5">
            Built for real student struggles
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PAIN_POINTS.map((p) => (
              <div
                key={p.title}
                className="bg-parch rounded-2xl border border-sand-mid p-4 flex gap-3 hover:border-sage transition-colors"
              >
                <span className="text-2xl shrink-0">{p.emoji}</span>
                <div>
                  <p className="font-bold text-bark-deep text-sm">{p.title}</p>
                  <p className="text-bark-soft text-xs mt-1 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4 — Before / after */}
        <section aria-labelledby="compare-heading">
          <SectionLabel>Before & after</SectionLabel>
          <h2 id="compare-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-5">
            Learning before vs with ilm.io
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-sand-mid bg-sand/50 p-5">
              <p className="text-xs font-bold text-bark-faint uppercase mb-3">Before</p>
              <ul className="space-y-2 text-sm text-bark-soft">
                <li>❌ Same PDF for everyone</li>
                <li>❌ Re-read chapters 3× to understand</li>
                <li>❌ No format choice</li>
                <li>❌ Teachers guess what helps</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-sage bg-sage-lo/40 p-5">
              <p className="text-xs font-bold text-sage-hi uppercase mb-3">With ilm.io</p>
              <ul className="space-y-2 text-sm text-bark-deep">
                <li>✓ Focus / calm / easy-read slides</li>
                <li>✓ Mind maps & practice questions</li>
                <li>✓ Mood-aware Ilm study actions</li>
                <li>✓ Educator insights & heatmaps</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2 — Learning profile */}
        <section aria-labelledby="profile-heading">
          <SectionLabel>Personalise</SectionLabel>
          <h2 id="profile-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-5">
            Build your learning profile
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-parch rounded-3xl border border-sand-mid p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-bark-faint mb-2">How do you learn best?</p>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_OPTS.condition.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(c)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                        condition === c
                          ? "border-sage bg-sage-lo text-sage-hi"
                          : "border-sand-mid bg-white text-bark-soft"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-bark-faint mb-2">Study pace</p>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_OPTS.pace.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPace(p)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                        pace === p
                          ? "border-dust bg-dust-lo text-dust-hi"
                          : "border-sand-mid bg-white text-bark-soft"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-bark-faint mb-2">Preferred output</p>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_OPTS.format.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                        format === f
                          ? "border-terra bg-terra-lo text-terra-hi"
                          : "border-sand-mid bg-white text-bark-soft"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 7 — Fingerprint */}
            <div className="bg-parch rounded-3xl border border-sand-mid p-5">
              <p className="text-xs font-bold text-bark-faint uppercase mb-4">Your learning fingerprint</p>
              <div className="space-y-3">
                {(
                  Object.entries(fingerprint) as [string, number][]
                ).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-bark-soft capitalize">{key}</span>
                      <span className="font-bold text-bark-deep">{val}%</span>
                    </div>
                    <div className="h-2.5 bg-sand rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage rounded-full transition-all duration-500"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-bark-faint mt-4 italic">
                Preview only — upload material on the student dashboard to generate your real profile.
              </p>
            </div>
          </div>
        </section>

        {/* 5 — Accessibility preview */}
        <section aria-labelledby="a11y-heading">
          <SectionLabel>Accessibility</SectionLabel>
          <h2 id="a11y-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-5">
            Controls that travel with you
          </h2>
          <div
            className={`rounded-3xl border-2 p-5 transition-colors ${
              highContrast ? "border-bark-deep bg-white" : "border-sand-mid bg-parch"
            }`}
          >
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                type="button"
                onClick={() => setAccFont(accFont === "default" ? "dyslexic" : "default")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                  accFont === "dyslexic" ? "border-sage bg-sage-lo" : "border-sand-mid"
                }`}
              >
                OpenDyslexic font
              </button>
              <button
                type="button"
                onClick={() => setAccSize(accSize === "md" ? "lg" : "md")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                  accSize === "lg" ? "border-sage bg-sage-lo" : "border-sand-mid"
                }`}
              >
                Larger text
              </button>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                  highContrast ? "border-bark-deep bg-bark-deep text-white" : "border-sand-mid"
                }`}
              >
                High contrast
              </button>
            </div>
            <p
              className={`leading-relaxed ${
                accSize === "lg" ? "text-lg" : "text-sm"
              } ${highContrast ? "text-black font-medium" : "text-bark-deep"}`}
              style={{
                fontFamily: accFont === "dyslexic" ? "Comic Sans MS, OpenDyslexic, sans-serif" : undefined,
              }}
            >
              This is how your study content can look — adjusted before you even open a lesson.
              Available on every page via the ♿ dock.
            </p>
          </div>
        </section>

        {/* 6 — Energy study demo */}
        <section aria-labelledby="energy-heading">
          <SectionLabel>Energy-aware</SectionLabel>
          <h2 id="energy-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-2">
            Study plan that matches your energy
          </h2>
          <p className="text-bark-soft text-sm mb-5">Drag to set how you feel — the plan adapts.</p>
          <div className="bg-parch rounded-3xl border border-sand-mid p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-bark-deep">{energyLabel}</span>
              <span className="text-xs text-bark-faint">{energy}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-sage mb-5"
              aria-label="Energy level"
            />
            <div className="space-y-2">
              {studyBlocks.map((b, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${b.color}`}
                >
                  <span className="text-lg font-black text-bark-faint w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-bark-deep">{b.task}</p>
                  </div>
                  <span className="text-xs font-bold text-bark-soft">{b.min} min</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4">
          <h2 className="font-serif text-2xl font-semibold text-bark-deep mb-6">
            Ready to learn your way?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <Link href="/student" className="group block text-left">
              <div className="bg-parch border-2 border-sand-mid rounded-3xl p-6 hover:border-sage hover:bg-sage-lo transition-all hover:-translate-y-0.5">
                <span className="text-3xl">🌱</span>
                <h3 className="font-serif text-xl font-semibold text-bark-deep mt-3">Student</h3>
                <p className="text-bark-soft text-xs mt-1">Upload · transform · Ilm actions</p>
              </div>
            </Link>
            <Link href="/educator" className="group block text-left">
              <div className="bg-parch border-2 border-sand-mid rounded-3xl p-6 hover:border-terra hover:bg-terra-lo transition-all hover:-translate-y-0.5">
                <span className="text-3xl">📚</span>
                <h3 className="font-serif text-xl font-semibold text-bark-deep mt-3">Educator</h3>
                <p className="text-bark-soft text-xs mt-1">Agents · insights · reports</p>
              </div>
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 text-bark-faint text-sm">
            {["🇬🇧", "🇲🇾", "🇨🇳", "🇮🇳"].map((f, i) => (
              <span key={i}>{f}</span>
            ))}
            <span>English · BM · 普通话 · தமிழ்</span>
          </div>
          <p className="text-bark-faint text-xs mt-8">Built by BiBiLabu 2026</p>
        </section>
      </div>
    </main>
  );
}
