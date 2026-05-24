"use client";

import { useState } from "react";
import Link from "next/link";
import { TransformComparisonDemo } from "@/app/components/landing/TransformComparisonDemo";
import { ResearchMalaysiaSection } from "@/app/components/landing/ResearchMalaysiaSection";
import { IlmSectionLabel } from "@/app/components/ilm/IlmSectionLabel";
import { IlmLogo } from "@/app/components/ilm/IlmLogo";
import { IlmLanguageSelect } from "@/app/components/ilm/IlmLanguageSelect";
import { LandingIlmChat } from "@/app/components/landing/LandingIlmChat";
import { PROFILE_FORMAT_OPTIONS } from "@/lib/ilm-formats";
import { useLandingCopy, useUiStrings } from "@/lib/use-ui-strings";
import { useIlmLanguage } from "@/lib/ilm-language";
import { getProfileOptions, getEnergyBlocks } from "@/lib/landing-demo-i18n";
import { getFormatLabel } from "@/lib/localized-formats";

const PAIN_EMOJI = ["📄", "⏱️", "🔤", "😰"];

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
  const ui = useUiStrings();
  const L = useLandingCopy();
  const { lang } = useIlmLanguage();
  const profileOpts = getProfileOptions(lang);
  const [conditionKey, setConditionKey] = useState("adhd");
  const [paceKey, setPaceKey] = useState("quick");
  const [formatKey, setFormatKey] = useState<string>(PROFILE_FORMAT_OPTIONS[0].key);
  const [energy, setEnergy] = useState(65);
  const [accFont, setAccFont] = useState<"default" | "dyslexic">("default");
  const [accSize, setAccSize] = useState<"md" | "lg">("md");
  const [highContrast, setHighContrast] = useState(false);

  const { label: energyLabel, studyBlocks } = getEnergyBlocks(lang, energy);

  const fingerprint = {
    visual: conditionKey === "autism" ? 72 : conditionKey === "adhd" ? 88 : 65,
    auditory: formatKey === "transcribe" ? 80 : 45,
    structured: conditionKey === "autism" ? 92 : 55,
    interactive: formatKey === "worksheet" || formatKey === "mindmap" ? 85 : 60,
    calm: conditionKey === "dyslexia" ? 90 : 70,
  };

  return (
    <main className="min-h-screen bg-cream relative">
      <style>{`
        @keyframes landingFloat {
          from { transform: translateY(0) scale(1); }
          to { transform: translateY(-20px) scale(1.03); }
        }
      `}</style>

      {/* One place for role choice — avoids duplicate hero + footer buttons */}
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-md border-b border-sand-mid">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 min-h-[3.75rem]">
          <Link href="/" className="shrink-0" aria-label="ilm.io home">
            <IlmLogo size="sm" variant="white-on-sage" showWordmark />
          </Link>
          <div className="hidden sm:block w-44 shrink-0 self-center">
            <IlmLanguageSelect id="ilm-lang-header" className="!pb-1" />
          </div>
          <nav className="flex items-center gap-2" aria-label="Choose your role">
            <Link
              href="/student"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-sage text-white hover:opacity-90 transition-opacity"
            >
              {ui.nav.student}
            </Link>
            <Link
              href="/educator"
              className="px-4 py-2 text-sm font-semibold rounded-xl border-2 border-terra text-terra-hi hover:bg-terra-lo transition-colors"
            >
              {ui.nav.educator}
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <FloatingShapes />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-12 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-bark-deep leading-[1.12] mb-3">
            {L.hero.line1}
            <br />
            <span className="text-sage">{L.hero.line2}</span>
            <br />
            {L.hero.line3}
          </h1>
          <p className="text-bark-soft text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            {L.hero.sub}
          </p>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 text-sm font-semibold text-sage-hi bg-sage-lo rounded-2xl hover:bg-sage/20 transition-colors"
          >
            {L.hero.cta}
            <span aria-hidden>↓</span>
          </a>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-12">
        <div className="sm:hidden max-w-xs mx-auto pb-1">
          <IlmLanguageSelect id="ilm-lang-mobile" />
        </div>

        {/* 1 — Transformation demo */}
        <section id="how-it-works" aria-labelledby="transform-heading">
          <IlmSectionLabel>{L.transform.label}</IlmSectionLabel>
          <h2 id="transform-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-2">
            {L.transform.title}
          </h2>
          <p className="text-bark-soft text-sm mb-4">{L.transform.sub}</p>
          <div className="bg-parch rounded-3xl border border-sand-mid p-4 sm:p-6 shadow-sm">
            <TransformComparisonDemo />
          </div>
        </section>

        <ResearchMalaysiaSection />

        {/* 3 — Pain points */}
        <section aria-labelledby="pain-heading">
          <IlmSectionLabel>{L.pain.label}</IlmSectionLabel>
          <h2 id="pain-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-5">
            {L.pain.title}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {L.pain.items.map((p, i) => (
              <div
                key={p.title}
                className="bg-parch rounded-2xl border border-sand-mid p-4 flex gap-3 hover:border-sage transition-colors"
              >
                <span className="text-2xl shrink-0">{PAIN_EMOJI[i]}</span>
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
          <IlmSectionLabel>{L.compare.label}</IlmSectionLabel>
          <h2 id="compare-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-5">
            {L.compare.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-sand-mid bg-sand/50 p-5">
              <p className="text-xs font-bold text-bark-faint uppercase mb-3">{L.compare.before}</p>
              <ul className="space-y-2 text-sm text-bark-soft">
                {L.compare.beforeList.map((item) => (
                  <li key={item}>❌ {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-sage bg-sage-lo/40 p-5">
              <p className="text-xs font-bold text-sage-hi uppercase mb-3">{L.compare.after}</p>
              <ul className="space-y-2 text-sm text-bark-deep">
                {L.compare.afterList.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 2 — Learning profile */}
        <section aria-labelledby="profile-heading">
          <IlmSectionLabel>{L.profile.label}</IlmSectionLabel>
          <h2 id="profile-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-5">
            {L.profile.title}
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-parch rounded-3xl border border-sand-mid p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-bark-faint mb-2">{L.profile.condition}</p>
                <div className="flex flex-wrap gap-2">
                  {profileOpts.conditions.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setConditionKey(c.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                        conditionKey === c.key
                          ? "border-sage bg-sage-lo text-sage-hi"
                          : "border-sand-mid bg-white text-bark-soft"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-bark-faint mb-2">{L.profile.pace}</p>
                <div className="flex flex-wrap gap-2">
                  {profileOpts.paces.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPaceKey(p.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                        paceKey === p.key
                          ? "border-dust bg-dust-lo text-dust-hi"
                          : "border-sand-mid bg-white text-bark-soft"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-bark-faint mb-2">{L.profile.output}</p>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFormatKey(f.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                        formatKey === f.key
                          ? "border-terra bg-terra-lo text-terra-hi"
                          : "border-sand-mid bg-white text-bark-soft"
                      }`}
                    >
                      {getFormatLabel(lang, f.key)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 7 — Fingerprint */}
            <div className="bg-parch rounded-3xl border border-sand-mid p-5">
              <p className="text-xs font-bold text-bark-faint uppercase mb-4">{L.profile.fingerprint}</p>
              <div className="space-y-3">
                {(
                  Object.entries(fingerprint) as [keyof typeof fingerprint, number][]
                ).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-bark-soft">{L.profile.fpKeys[key] ?? key}</span>
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
              <p className="text-[11px] text-bark-faint mt-4 italic">{L.profile.fingerprintNote}</p>
            </div>
          </div>
        </section>

        {/* 5 — Accessibility preview */}
        <section aria-labelledby="a11y-heading">
          <IlmSectionLabel>{L.a11y.label}</IlmSectionLabel>
          <h2 id="a11y-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-5">
            {L.a11y.title}
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
                {L.a11y.dyslexic}
              </button>
              <button
                type="button"
                onClick={() => setAccSize(accSize === "md" ? "lg" : "md")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                  accSize === "lg" ? "border-sage bg-sage-lo" : "border-sand-mid"
                }`}
              >
                {L.a11y.larger}
              </button>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                  highContrast ? "border-bark-deep bg-bark-deep text-white" : "border-sand-mid"
                }`}
              >
                {L.a11y.contrast}
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
              {L.a11y.preview}
            </p>
          </div>
        </section>

        {/* 6 — Energy study demo */}
        <section aria-labelledby="energy-heading">
          <IlmSectionLabel>{L.energy.label}</IlmSectionLabel>
          <h2 id="energy-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep mb-2">
            {L.energy.title}
          </h2>
          <p className="text-bark-soft text-sm mb-5">{L.energy.sub}</p>
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
                  <span className="text-xs font-bold text-bark-soft">{b.minLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role choice — only CTA block on the page (header links match these) */}
        <section className="text-center pt-4" aria-labelledby="start-heading">
          <h2 id="start-heading" className="font-serif text-2xl font-semibold text-bark-deep mb-2">
            {L.start.title}
          </h2>
          <p className="text-bark-soft text-sm mb-6 max-w-md mx-auto">{L.start.sub}</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <Link href="/student" className="group block text-left">
              <div className="bg-parch border-2 border-sand-mid rounded-3xl p-6 hover:border-sage hover:bg-sage-lo transition-all hover:-translate-y-0.5">
                <span className="text-3xl">🌱</span>
                <h3 className="font-serif text-xl font-semibold text-bark-deep mt-3">{L.start.studentTitle}</h3>
                <p className="text-bark-soft text-xs mt-1">{L.start.studentDesc}</p>
              </div>
            </Link>
            <Link href="/educator" className="group block text-left">
              <div className="bg-parch border-2 border-sand-mid rounded-3xl p-6 hover:border-terra hover:bg-terra-lo transition-all hover:-translate-y-0.5">
                <span className="text-3xl">📚</span>
                <h3 className="font-serif text-xl font-semibold text-bark-deep mt-3">{L.start.educatorTitle}</h3>
                <p className="text-bark-soft text-xs mt-1">{L.start.educatorDesc}</p>
              </div>
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 text-bark-faint text-sm">
            {["🇬🇧", "🇲🇾", "🇨🇳", "🇮🇳"].map((f, i) => (
              <span key={i}>{f}</span>
            ))}
            <span>{L.start.langs}</span>
          </div>
          <p className="text-bark-faint text-xs mt-8">Built by BiBiLabu 2026</p>
        </section>
      </div>

      <LandingIlmChat />
    </main>
  );
}
