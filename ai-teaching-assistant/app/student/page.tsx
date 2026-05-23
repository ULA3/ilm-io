"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type {
  PocketsResponse, StudentADHDSlide, StudentAutismSlide, DyslexiaSlide,
  MindmapResponse, ExaminerWorksheetResponse, TranscribeResponse,
  AgentSlidesResponse, Language,
} from "@/lib/api";
import { TranslatingOverlay } from "@/app/components/TranslatingOverlay";
import { getAccSettings } from "@/app/components/AccessibilityWidget";
import { DownloadBar } from "@/app/components/DownloadBar";
import { StudentIlmChat } from "@/app/components/StudentIlmChat";
import { trackEvent } from "@/lib/track";
import {
  buildFocusSlidesHtml,
  buildCalmSlidesHtml,
  buildEasyReadHtml,
  buildMindmapHtml,
} from "@/lib/slide-export-html";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English",       flag: "🇬🇧" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "zh", label: "普通话",         flag: "🇨🇳" },
  { code: "ta", label: "தமிழ்",          flag: "🇮🇳" },
];

type PipelineStep = "idle" | "uploading" | "reading" | "ready" | "generating" | "done" | "error";
type OutputKind   = "adhd" | "autism" | "dyslexia" | "mindmap" | "worksheet";

/* ── Theme helpers ──────────────────────────────────────────── */
const THEME_RING: Record<string, string>  = { teal:"ring-[#009688]", amber:"ring-[#FFB300]", rose:"ring-[#E53935]", violet:"ring-[#7344B8]" };
const THEME_BADGE: Record<string, string> = { teal:"bg-[#E0F2F1] text-[#004D40]", amber:"bg-[#FFF8E1] text-[#4E3400]", rose:"bg-[#FFEBEE] text-[#4A0002]", violet:"bg-[#EDE7F6] text-[#310077]" };
const THEME_ACCENT: Record<string, string> = { teal:"bg-[#009688]", amber:"bg-[#FFB300]", rose:"bg-[#E53935]", violet:"bg-[#7344B8]" };

/* ── Canva-style rich slide colour themes ──────────────────── */
const CANVA: Record<string, {
  header: string; headerText: string; content: string;
  accent: string; bubble1: string; bubble2: string;
  factBg: string; factText: string; qBg: string; qText: string;
}> = {
  teal:   { header:"#009688", headerText:"#fff",    content:"#F0FDFC", accent:"#00796B", bubble1:"rgba(255,255,255,0.13)", bubble2:"rgba(0,0,0,0.07)",  factBg:"#E0F7FA", factText:"#00695C", qBg:"#B2EBF2", qText:"#004D40" },
  amber:  { header:"#E8A000", headerText:"#1C1100", content:"#FFFBEF", accent:"#92400E", bubble1:"rgba(255,255,255,0.22)", bubble2:"rgba(0,0,0,0.05)",  factBg:"#FEF3C7", factText:"#92400E", qBg:"#FDE68A", qText:"#451A03" },
  rose:   { header:"#E53935", headerText:"#fff",    content:"#FFF5F5", accent:"#B71C1C", bubble1:"rgba(255,255,255,0.13)", bubble2:"rgba(0,0,0,0.07)",  factBg:"#FEE2E2", factText:"#991B1B", qBg:"#FECACA", qText:"#450A0A" },
  violet: { header:"#7344B8", headerText:"#fff",    content:"#F5F3FF", accent:"#4C1D95", bubble1:"rgba(255,255,255,0.13)", bubble2:"rgba(0,0,0,0.07)",  factBg:"#EDE9FE", factText:"#4C1D95", qBg:"#DDD6FE", qText:"#2E1065" },
};

/* ── Floating nature leaves background ─────────────────────── */
function FloatingLeaves() {
  const leaves = [
    { size:34, top:"8%",   left:"6%",   rot:"-15deg",  delay:"0s",    dur:"14s", opacity:0.22 },
    { size:22, top:"18%",  left:"82%",  rot:"25deg",   delay:"2s",    dur:"18s", opacity:0.18 },
    { size:28, top:"38%",  left:"3%",   rot:"-5deg",   delay:"5s",    dur:"16s", opacity:0.2  },
    { size:18, top:"52%",  left:"91%",  rot:"40deg",   delay:"1s",    dur:"20s", opacity:0.15 },
    { size:38, top:"68%",  left:"10%",  rot:"-30deg",  delay:"7s",    dur:"12s", opacity:0.2  },
    { size:24, top:"75%",  left:"75%",  rot:"18deg",   delay:"3.5s",  dur:"17s", opacity:0.17 },
    { size:20, top:"88%",  left:"45%",  rot:"-10deg",  delay:"9s",    dur:"15s", opacity:0.14 },
    { size:30, top:"25%",  left:"55%",  rot:"32deg",   delay:"6s",    dur:"22s", opacity:0.12 },
  ];
  return (
    <div className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes leafDrift {
          0%   { transform: translateY(0px)   rotate(var(--rot)) scale(1); }
          33%  { transform: translateY(-18px) rotate(calc(var(--rot) + 8deg)) scale(1.04); }
          66%  { transform: translateY(8px)   rotate(calc(var(--rot) - 6deg)) scale(0.97); }
          100% { transform: translateY(-10px) rotate(calc(var(--rot) + 3deg)) scale(1.02); }
        }
      `}</style>
      {leaves.map((l, i) => (
        <div key={i} style={{
          position:"absolute", top:l.top, left:l.left, width:l.size, height:l.size,
          opacity:l.opacity, "--rot":l.rot,
          animation:`leafDrift ${l.dur} ease-in-out ${l.delay} infinite alternate`,
        } as React.CSSProperties}>
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2 C30 2 38 10 38 20 C38 32 28 38 20 38 C12 34 4 28 2 18 C0 8 10 2 20 2Z"
              fill="#7A9E7E" />
            <path d="M20 38 C20 38 20 20 20 2" stroke="#5C7A5E" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M20 22 C14 18 8 16 6 14" stroke="#5C7A5E" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
            <path d="M20 28 C26 24 32 20 34 18" stroke="#5C7A5E" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ── Bionic Reading — bold first 1-3 chars per word as fixation anchors ── */
function bionicN(len: number): number {
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  return Math.ceil(len * 0.4);
}
function FeatureBanner({ emoji, title, desc, className }: { emoji: string; title: string; desc: string; className: string }) {
  return (
    <div className={`rounded-2xl px-4 py-3 mb-4 border-2 flex items-start gap-3 ${className}`}>
      <span className="text-2xl shrink-0">{emoji}</span>
      <div>
        <p className="font-black text-sm uppercase tracking-wide">{title}</p>
        <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Bionic({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => {
        if (!word) return <span key={i}> </span>;
        const n = bionicN(word.length);
        return (
          <span key={i}>
            <span className="font-black">{word.slice(0, n)}</span>
            <span className="font-light">{word.slice(n)}</span>
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
}

/* ── Chat bubble text renderer — handles bullet points ─────── */
function ChatText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const content = trimmed.slice(1).trim();
          return (
            <div key={i} className="flex items-start gap-1.5 mt-1 pl-1">
              <span className="shrink-0 mt-0.5 opacity-60 text-[11px]">•</span>
              <span>{content}</span>
            </div>
          );
        }
        if (trimmed === "") return <div key={i} className="h-1" />;
        return <div key={i}>{line}</div>;
      })}
    </>
  );
}

/* ── Audio stage labels ─────────────────────────────────────── */
const AUDIO_STAGES = [
  { icon: "📖", label: "Organising concept pockets…" },
  { icon: "✍️", label: "Scripting the narrative…" },
  { icon: "✨", label: "Polishing the prose…" },
  { icon: "🔊", label: "Rendering MP3 audio…" },
];

/* ── Condition tags per output kind ─────────────────────────── */
const KIND_CONDITIONS: Record<string, string[]> = {
  adhd:      ["Busy minds"],
  autism:    ["Calm thinkers"],
  audio:     ["Listeners", "Busy minds"],
  mindmap:   ["Visual thinkers", "Busy minds"],
  worksheet: ["Hands-on learners"],
};

/* ── Pipeline Indicator ─────────────────────────────────────── */
function PipelineIndicator({ step }: { step: PipelineStep }) {
  const steps = [
    { key: "uploading",  label: "Upload" },
    { key: "reading",    label: "Read" },
    { key: "ready",      label: "Select" },
    { key: "generating", label: "Generate" },
    { key: "done",       label: "Done" },
  ];
  const idx = steps.findIndex(s => s.key === step || (step === "error" && s.key === "generating"));
  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
            i < idx ? "bg-sage text-white" : i === idx ? "bg-dust text-white" : "bg-sand text-bark-faint"
          }`}>
            {i < idx && <span>✓</span>}
            <span>{s.label}</span>
          </div>
          {i < steps.length - 1 && <span className={`text-xs ${i < idx ? "text-sage" : "text-sand-mid"}`}>›</span>}
        </div>
      ))}
    </div>
  );
}

/* ── Pocket Card ────────────────────────────────────────────── */
function PocketCard({ pocket }: { pocket: api.Pocket }) {
  const [expanded, setExpanded] = useState(false);
  const typeColors: Record<string, string> = {
    concept: "bg-sage-lo text-sage-hi", fact: "bg-honey-lo text-bark-deep",
    process: "bg-dust-lo text-dust", example: "bg-terra-lo text-terra-hi",
  };
  return (
    <div className="bg-white rounded-2xl border border-sand-mid shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-sand/30 transition-colors">
        <div className="w-6 h-6 bg-dust-lo rounded-lg flex items-center justify-center text-dust text-xs font-bold shrink-0 mt-0.5">{pocket.id}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-bark-deep text-sm">{pocket.concept}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColors[pocket.pocket_type] ?? "bg-sand text-bark"}`}>{pocket.pocket_type}</span>
          </div>
          <div className="flex gap-0.5 mt-1">
            {[1,2,3,4,5].map(n => <div key={n} className={`w-2 h-2 rounded-full ${n <= pocket.complexity ? "bg-dust" : "bg-sand-mid"}`} />)}
          </div>
        </div>
        <span className="text-bark-faint text-sm shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-sand">
          <ul className="space-y-1 mt-3">
            {pocket.key_points.map((kp, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-bark-deep">
                <span className="text-dust mt-0.5 shrink-0">•</span>{kp}
              </li>
            ))}
          </ul>
          {pocket.examples.length > 0 && (
            <div className="bg-honey-lo rounded-xl px-3 py-2">
              <p className="text-[10px] font-semibold text-bark-faint uppercase tracking-wide mb-1">Example</p>
              <p className="text-xs text-bark-deep">{pocket.examples[0]}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Dyslexia / Easy Read Slides Panel ─────────────────────── */
function DyslexiaSlidesPanel({ result }: { result: AgentSlidesResponse }) {
  const slides = result.slides as DyslexiaSlide[];
  return (
    <div className="space-y-4">
      <FeatureBanner
        emoji="📖"
        title="Easy Read Slides"
        desc="Blue headers · huge spacing · yellow key phrases · bionic text — built for dyslexia"
        className="bg-[#E8F4FD] border-[#1A5C96] text-[#1A5C96]"
      />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-bark-deep">{result.slide_count} slides</h3>
          <p className="text-[10px] text-[#1A5C96] font-semibold mt-0.5">Download as PPTX, PDF, or PNG</p>
        </div>
        <DownloadBar
          title="Easy Read Slides"
          pptxUrl={result.download_url}
          htmlBody={buildEasyReadHtml(slides)}
          accentColor="#1A5C96"
          trackTopic="Easy Read Slides"
        />
      </div>
      {slides.map((s, i) => (
        <div key={i} className="rounded-2xl overflow-hidden shadow-lg border border-[#E8F4FD]">
          <div className="relative overflow-hidden bg-[#1A5C96] px-6 pt-5 pb-8" style={{ minHeight: 110 }}>
            <h4 className="text-white text-xl font-black leading-tight relative z-10">
              <Bionic text={s.title} />
            </h4>
          </div>
          <div className="bg-[#FAF8F5] px-6 py-5 space-y-3">
            <ul className="space-y-3">
              {(s.bullets ?? []).map((b, j) => (
                <li key={j} className="flex items-start gap-3 text-base text-[#1C1C1C] leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-[#1A5C96] shrink-0 mt-2.5" />
                  <Bionic text={b} />
                </li>
              ))}
            </ul>
            {s.key_phrase && (
              <div className="bg-[#FFF080] rounded-xl px-4 py-3">
                <p className="font-black text-[#1C1C1C] text-lg">{s.key_phrase}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── ADHD / Focus Slides Panel ──────────────────────────────── */
function ADHDPanel({ result }: { result: AgentSlidesResponse }) {
  const slides = result.slides as StudentADHDSlide[];
  return (
    <div className="space-y-4">
      <FeatureBanner
        emoji="🧩"
        title="Focus Slides"
        desc="Colour themes · one idea per slide · focus questions · timer badges · fun facts — ADHD-friendly"
        className="bg-dust-lo border-dust text-dust-hi"
      />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-bark-deep">{result.slide_count} slides</h3>
          <p className="text-[10px] text-dust font-semibold mt-0.5">PPTX · PDF · PNG</p>
        </div>
        <DownloadBar
          title="Focus Slides"
          pptxUrl={result.download_url}
          htmlBody={buildFocusSlidesHtml(slides, "Focus Slides")}
          accentColor="#009688"
          trackTopic="Focus Slides"
        />
      </div>

      {/* Slide cards — Canva style */}
      {slides.map((s, i) => {
        const t = CANVA[s.color_theme] ?? CANVA.teal;
        return (
          <div key={i} className="rounded-2xl overflow-hidden shadow-lg border border-sand-mid">
            {/* Coloured slide header */}
            <div className="relative overflow-hidden px-6 pt-5 pb-8" style={{ background: t.header, minHeight: 128 }}>
              {/* Decorative blobs */}
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full" style={{ background: t.bubble1 }} />
              <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full" style={{ background: t.bubble2 }} />
              <div className="absolute top-4 right-5 w-12 h-12 rounded-full" style={{ background: t.bubble1 }} />
              {/* Meta row */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background:"rgba(0,0,0,0.18)", color: t.headerText }}>
                  {String(s.index).padStart(2,"0")}
                </span>
                {s.timer_minutes && (
                  <span className="text-xs font-semibold" style={{ color:`${t.headerText}CC` }}>⏱ {s.timer_minutes} min focus</span>
                )}
              </div>
              {/* Title */}
              <h4 className="text-xl font-black leading-tight relative z-10" style={{ color: t.headerText }}>
                <Bionic text={s.title} />
              </h4>
            </div>
            {/* Thin gradient bridge */}
            <div className="h-1.5" style={{ background:`linear-gradient(to right,${t.header}99,transparent)` }} />
            {/* Content area */}
            <div className="px-6 py-4 space-y-3" style={{ background: t.content }}>
              {/* Focus hook */}
              {s.focus_question && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-2.5" style={{ background: t.qBg }}>
                  <span className="text-lg shrink-0">🎯</span>
                  <p className="text-sm font-bold" style={{ color: t.qText }}>{s.focus_question}</p>
                </div>
              )}
              {/* Bullets */}
              <ul className="space-y-2">
                {(s.bullets ?? []).map((b, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-bark-deep">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ background: t.accent }} />
                    <Bionic text={b} />
                  </li>
                ))}
              </ul>
              {s.visual_hint && (
                <div className="bg-white/70 border border-sand-mid rounded-xl px-3 py-2 text-xs text-bark-soft italic">🖼 {s.visual_hint}</div>
              )}
              {s.mind_map_hint && (
                <div className="bg-white/70 border border-sand-mid rounded-xl px-3 py-2 text-xs text-bark-soft">🗺 {s.mind_map_hint}</div>
              )}
              {/* Fun fact */}
              {s.fun_fact && (
                <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ background: t.factBg }}>
                  <span className="text-base shrink-0">⚡</span>
                  <p className="text-sm font-semibold" style={{ color: t.factText }}>{s.fun_fact}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Calm / Clear Slides Panel ──────────────────────────────── */
function AutismPanel({ result }: { result: AgentSlidesResponse }) {
  const slides = result.slides as StudentAutismSlide[];
  return (
    <div className="space-y-4">
      <FeatureBanner
        emoji="🗂️"
        title="Clear & Calm Slides"
        desc="Navy header · progress dots · What / Details / Why — identical structure every slide"
        className="bg-[#E8EAF6] border-[#3F51B5] text-[#1A237E]"
      />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-bark-deep">{result.slide_count} slides</h3>
          <p className="text-[10px] text-[#3F51B5] font-semibold mt-0.5">PPTX · PDF · PNG</p>
        </div>
        <DownloadBar
          title="Clear & Calm Slides"
          pptxUrl={result.download_url}
          htmlBody={buildCalmSlidesHtml(slides)}
          accentColor="#3F51B5"
          trackTopic="Clear & Calm Slides"
        />
      </div>

      {/* Slide cards — structured / consistent layout */}
      {slides.map((s, i) => (
        <div key={i} className="rounded-2xl overflow-hidden shadow-lg border border-[#C5CAE9]">
          {/* Deep indigo header */}
          <div className="relative overflow-hidden bg-[#1A237E] px-6 py-5">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/8" />
            <div className="absolute bottom-0 left-1/2 w-40 h-16 rounded-full bg-white/5" />
            {/* Progress dots — same on every slide so layout is predictable */}
            <div className="flex gap-1 mb-3 relative z-10">
              {slides.map((_, di) => (
                <div key={di} className={`h-1.5 rounded-full flex-1 transition-all ${di === i ? "bg-[#90CAF9]" : "bg-white/20"}`} />
              ))}
            </div>
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white font-black text-sm">{s.index}</span>
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Topic {s.index} of {slides.length}</p>
                <h4 className="text-white text-lg font-bold leading-snug">
                  <Bionic text={s.heading} />
                </h4>
              </div>
            </div>
          </div>

          {/* Content — identical structure every slide */}
          <div className="bg-white p-5 space-y-3">
            {/* What section */}
            <div className="flex items-start gap-3 bg-[#E8EAF6] rounded-xl px-4 py-3">
              <span className="text-[#1A237E] font-black text-[10px] uppercase tracking-wider shrink-0 mt-0.5 w-9 pt-0.5">What</span>
              <p className="text-bark-deep text-sm leading-relaxed"><Bionic text={s.what} /></p>
            </div>

            {/* Numbered details */}
            <div>
              <p className="text-[10px] font-black text-[#1A237E] uppercase tracking-wider mb-2">Key Details</p>
              <ul className="space-y-2">
                {(s.details ?? []).map((d, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-bark-deep">
                    <span className="w-5 h-5 rounded-full bg-[#E8EAF6] text-[#1A237E] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">{j+1}</span>
                    <Bionic text={d} />
                  </li>
                ))}
              </ul>
            </div>

            {s.why_it_matters && (
              <div className="border-l-4 border-[#3F51B5] pl-3">
                <p className="text-[10px] font-black text-[#1A237E] uppercase tracking-wider mb-1">Why it matters</p>
                <p className="text-bark-soft text-xs leading-relaxed">{s.why_it_matters}</p>
              </div>
            )}
            {s.visual_description && (
              <div className="bg-[#F5F5F5] rounded-xl px-3 py-2 text-xs text-bark-faint italic">
                [ Visual ] {s.visual_description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Audio / Transcribe Panel ───────────────────────────────── */
function AudioPanel({ result }: { result: TranscribeResponse }) {
  const { script, estimated_duration_minutes, word_count, audio_url } = result;
  const [activeSegment, setActive] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function downloadMp3() {
    if (!audio_url || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`${BASE}${audio_url}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "ilmio-audio-story.mp3";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert("Could not download MP3 — please regenerate."); }
    finally { setDownloading(false); }
  }

  return (
    <div className="space-y-4">
      {/* Dyslexia badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#E8F4FD] rounded-xl border border-[#1A5C96]/20">
        <span className="text-[#1A5C96] text-base">🔤</span>
        <p className="text-[#1A5C96] text-xs font-semibold">Dyslexia-friendly · Audio removes the need to decode written text</p>
      </div>
      <div className="bg-white rounded-2xl border border-sage-lo shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 bg-sage-lo rounded-xl flex items-center justify-center text-xl">🎧</span>
          <div className="flex-1">
            <p className="font-bold text-bark-deep text-base">{script?.title ?? "Audio Story"}</p>
            <p className="text-bark-faint text-xs">~{estimated_duration_minutes?.toFixed(1)} min · {word_count} words</p>
          </div>
          {audio_url ? (
            <button onClick={downloadMp3} disabled={downloading}
              className="flex items-center gap-2 bg-sage text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 shrink-0 disabled:opacity-50">
              {downloading
                ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Downloading…</>
                : "⬇ MP3"}
            </button>
          ) : (
            <span className="text-xs text-bark-faint bg-sand px-3 py-1.5 rounded-xl shrink-0">Script only</span>
          )}
        </div>
        {script?.intro && (
          <div className="bg-sage-lo rounded-xl p-4 mb-4">
            <p className="text-bark-deep text-sm leading-loose italic">{script.intro}</p>
          </div>
        )}
        <div className="space-y-3">
          {(script?.segments ?? []).map((seg, i) => (
            <div key={i} className="border border-sand-mid rounded-xl overflow-hidden">
              <button onClick={() => setActive(activeSegment === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-sand hover:bg-sand-mid transition-colors text-left">
                <span className="w-5 h-5 bg-sage text-white text-xs rounded-full flex items-center justify-center shrink-0">{i+1}</span>
                <p className="font-semibold text-bark-deep text-sm flex-1">{seg.concept}</p>
                <span className="text-bark-faint">{activeSegment === i ? "▲" : "▼"}</span>
              </button>
              {activeSegment === i && (
                <div className="px-4 pb-4 pt-2 bg-white">
                  <p className="text-bark-deep text-sm leading-loose whitespace-pre-line">{seg.narrative}</p>
                  {seg.transition && <p className="text-sage text-xs mt-3 italic">{seg.transition}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        {script?.outro && (
          <div className="mt-4 bg-terra-lo rounded-xl p-4">
            <p className="text-bark-deep text-sm leading-loose italic">{script.outro}</p>
          </div>
        )}
      </div>
      <div className="bg-parch rounded-2xl border border-sand-mid p-5">
        <p className="text-xs font-semibold text-bark-faint uppercase tracking-wider mb-3">Full Script</p>
        <div className="bg-sand rounded-xl p-4 max-h-64 overflow-y-auto">
          <p className="text-bark-deep text-sm leading-loose whitespace-pre-line">{result.full_text}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Mind Map Panel ─────────────────────────────────────────── */
const BRANCH_STYLES: Record<string, { pill: string; card: string; dot: string }> = {
  teal:   { pill:"bg-[#E0F2F1] text-[#004D40]", card:"border-[#009688]", dot:"bg-[#009688]" },
  amber:  { pill:"bg-[#FFF8E1] text-[#4E3400]", card:"border-[#FFB300]", dot:"bg-[#FFB300]" },
  rose:   { pill:"bg-[#FFEBEE] text-[#4A0002]", card:"border-[#E53935]", dot:"bg-[#E53935]" },
  violet: { pill:"bg-[#EDE7F6] text-[#310077]", card:"border-[#7344B8]", dot:"bg-[#7344B8]" },
  sage:   { pill:"bg-[#DCE8DB] text-[#1B341A]", card:"border-[#5E7D5C]", dot:"bg-[#5E7D5C]" },
  dust:   { pill:"bg-[#D8E5ED] text-[#1A2E3A]", card:"border-[#4D6F82]", dot:"bg-[#4D6F82]" },
};

function MindmapPanel({ result }: { result: MindmapResponse }) {
  const mm = result.mindmap;
  const [activeBranch, setActiveBranch] = useState<number | null>(null);
  return (
    <div className="space-y-5">
      <FeatureBanner
        emoji="🗺️"
        title="Visual Mind Map"
        desc="Hub-and-spoke layout · colour branches · expandable nodes — see how ideas connect"
        className="bg-terra-lo border-terra text-terra-hi"
      />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-bark-deep">{mm.topic}</h3>
        <DownloadBar
          title={`Mind Map — ${mm.topic}`}
          pptxUrl={result.download_url}
          htmlBody={buildMindmapHtml(mm)}
          accentColor="#7344B8"
          trackTopic="Visual Mind Map"
        />
      </div>

      {/* Radial hub layout */}
      <div className="relative flex flex-col items-center py-6">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-48 h-48 rounded-full border-4 border-dashed border-terra" />
          <div className="absolute w-64 h-px bg-terra rotate-0" />
          <div className="absolute w-64 h-px bg-terra rotate-45" />
          <div className="absolute w-64 h-px bg-terra rotate-90" />
          <div className="absolute w-64 h-px bg-terra -rotate-45" />
        </div>
      <div className="bg-bark-deep rounded-2xl p-5 text-center relative z-10 max-w-md w-full shadow-xl ring-4 ring-terra-lo">
        <p className="text-white font-serif text-2xl font-bold mb-2">{mm.topic}</p>
        <p className="text-white/80 text-sm leading-relaxed">{mm.summary}</p>
      </div>
      </div>

      {/* Branches grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mm.branches.map((branch, i) => {
          const st = BRANCH_STYLES[branch.color] ?? BRANCH_STYLES["teal"];
          return (
            <div key={i} className={`bg-white rounded-2xl border-2 overflow-hidden ${st.card}`}>
              <button onClick={() => setActiveBranch(activeBranch === i ? null : i)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-sand/30 transition-colors">
                <span className="text-2xl shrink-0">{branch.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-bark-deep text-sm">{branch.label}</p>
                  <p className="text-bark-faint text-xs">{branch.subnodes.length} concepts</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.pill}`}>{branch.color}</span>
                <span className="text-bark-faint text-sm">{activeBranch === i ? "▲" : "▼"}</span>
              </button>
              {activeBranch === i && (
                <div className="px-4 pb-4 pt-1 border-t border-sand space-y-2">
                  {branch.subnodes.map((sn, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${st.dot}`} />
                      <p className="text-bark-deep text-sm">{sn}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fun facts */}
      {mm.fun_facts.length > 0 && (
        <div className="bg-[#FFF0C0] rounded-2xl p-4">
          <p className="text-xs font-bold text-[#4E3400] uppercase tracking-wide mb-3">⚡ Fun Facts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mm.fun_facts.map((f, i) => (
              <div key={i} className="bg-white/60 rounded-xl px-3 py-2 text-sm text-[#4E3400]">{f}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Worksheet HTML generator ───────────────────────────────── */
function buildWorksheetHtml(ws: ExaminerWorksheetResponse["worksheet"], topic: string, showAnswers: boolean): string {
  const ans = (t: string) => showAnswers ? `<span class="answer">${t}</span>` : `<span class="blank">___________</span>`;
  const fillSentence = (sentence: string, answer: string) => sentence.replace(/_{2,}/g, ans(answer));
  const rows = (n: number) => Array.from({length: n}, () => `<div class="line"></div>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${showAnswers ? "Answer Sheet" : "Worksheet"} — ${topic}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:750px;margin:40px auto;padding:0 24px;color:#333;line-height:1.7}
  h1{font-size:22px;border-bottom:2px solid #8FA68E;padding-bottom:8px}
  h2{font-size:15px;background:#EDE5D8;padding:6px 12px;border-radius:6px;margin-top:24px}
  .item{margin:10px 0;padding:8px 12px;background:#F7F3EC;border-radius:6px;font-size:14px}
  .blank{display:inline-block;border-bottom:2px solid #333;min-width:100px;margin:0 4px}
  .answer{color:#2c7a2c;font-weight:bold}
  .line{border-bottom:1px solid #ccc;margin:10px 0;height:18px}
  .word-bank{background:#DCE8DB;padding:10px 14px;border-radius:8px;margin:12px 0;font-size:13px}
  .tf-true{color:#2c7a2c;font-weight:bold} .tf-false{color:#c0392b;font-weight:bold}
  .match-pair{display:flex;gap:24px;margin:8px 0;font-size:14px}
  .challenge{background:#FFF0C0;border:2px solid #D4A853;border-radius:8px;padding:14px;margin-top:20px}
  @media print{body{margin:20px}}
</style></head><body>
${showAnswers ? `<div style="background:#DCE8DB;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:13px;color:#1a4d1a;font-weight:600">🔑 ANSWER SHEET — For teacher use only</div>` : ""}
<h1>${ws.title}</h1>
<p style="font-style:italic;color:#888;font-size:13px">${ws.instructions ?? ""}</p>
${(ws.word_bank ?? []).length ? `<div class="word-bank"><strong>Word Bank:</strong> ${(ws.word_bank ?? []).join(" · ")}</div>` : ""}
${(ws.fill_blanks ?? []).length ? `<h2>Part A · Fill in the Blanks</h2>${(ws.fill_blanks ?? []).map((fb,i) => `<div class="item">${i+1}. ${fillSentence(fb.sentence, fb.answer)}</div>`).join("")}` : ""}
${(ws.true_false ?? []).length ? `<h2>Part B · True or False</h2>${(ws.true_false ?? []).map((tf,i) => `<div class="item">${i+1}. ${tf.statement} ${showAnswers ? `<span class="${tf.answer?"tf-true":"tf-false"}">[${tf.answer?"TRUE":"FALSE"}] — ${tf.explanation}</span>` : `<strong>[ TRUE / FALSE ]</strong>`}</div>`).join("")}` : ""}
${(ws.short_answer ?? []).length ? `<h2>Part C · Short Answer</h2>${(ws.short_answer ?? []).map((sa,i) => `<div class="item">${i+1}. ${sa.prompt}<br><em style="font-size:12px;color:#888">💡 ${sa.hint}</em>${showAnswers && sa.model_answer ? `<div style="margin-top:8px;padding:8px 12px;background:#DCE8DB;border-radius:6px;color:#1a4d1a;font-size:13px"><strong>✓ Model answer:</strong> ${sa.model_answer}</div>` : rows(3)}</div>`).join("")}` : ""}
${(ws.match_it ?? []).length ? `<h2>Part D · Match It</h2>${(ws.match_it ?? []).map((m,i) => showAnswers ? `<div class="match-pair"><span><strong>${String.fromCharCode(65+i)}.</strong> ${m.term}</span><span class="answer">→ ${m.definition}</span></div>` : `<div class="item">${String.fromCharCode(65+i)}. ${m.term} → _____________</div>`).join("")}` : ""}
${ws.challenge ? `<div class="challenge"><strong>🌟 ${ws.challenge.title}</strong><p>${ws.challenge.prompt}</p>${rows(showAnswers ? 1 : 4)}</div>` : ""}
</body></html>`;
}

function dlBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ── Worksheet Short Answer Item (with AI check) ───────────── */
function ShortAnswerItem({ sa, index, lang }: {
  sa: { prompt: string; hint: string; model_answer?: string };
  index: number;
  lang: Language;
}) {
  const [answer, setAnswer]   = useState("");
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<api.CheckAnswerResponse | null>(null);

  async function check() {
    if (!answer.trim() || checking) return;
    setChecking(true); setFeedback(null);
    try {
      const r = await api.checkAnswer(sa.prompt, answer, sa.model_answer ?? "", sa.hint, lang);
      setFeedback(r);
    } catch { setFeedback({ correct: "partial", feedback: "Could not check right now — try again.", suggestion: "" }); }
    finally { setChecking(false); }
  }

  const resultColor = feedback?.correct === true ? "border-sage bg-sage-lo" : feedback?.correct === false ? "border-terra bg-terra-lo" : "border-honey bg-honey-lo";

  return (
    <div className="bg-white rounded-xl p-4">
      <p className="text-bark-deep text-sm font-medium mb-1">{sa.prompt}</p>
      <p className="text-bark-faint text-xs mb-3 italic">💡 {sa.hint}</p>
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        rows={3}
        placeholder="Write your answer here…"
        className="w-full bg-sand rounded-xl px-3 py-2 text-sm text-bark-deep placeholder-bark-faint focus:outline-none focus:ring-2 focus:ring-sage resize-none"
      />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={check} disabled={!answer.trim() || checking}
          className="flex items-center gap-1.5 bg-sage text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 disabled:opacity-40 transition-opacity">
          {checking ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "✦"}
          {checking ? "Checking…" : "Check with Ilm"}
        </button>
        {feedback && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${resultColor}`}>
            {feedback.correct === true ? "✓ Correct" : feedback.correct === false ? "✗ Try again" : "~ Partial"}
          </span>
        )}
      </div>
      {feedback && (
        <div className={`mt-2 rounded-xl px-3 py-2 border ${resultColor}`}>
          <p className="text-bark-deep text-xs">{feedback.feedback}</p>
          {feedback.suggestion && <p className="text-bark-soft text-xs mt-1 italic">{feedback.suggestion}</p>}
        </div>
      )}
    </div>
  );
}

/* ── Examiner Worksheet Panel ───────────────────────────────── */
function WorksheetPanel({ result, lang }: { result: ExaminerWorksheetResponse; lang: Language }) {
  const ws = result.worksheet ?? {} as ExaminerWorksheetResponse["worksheet"];
  const topic = result.topic ?? "topic";
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({});
  const [fillChecked, setFillChecked] = useState<Record<number, boolean>>({});
  const [tfAnswers, setTfAnswers]     = useState<Record<number, boolean | null>>({});

  // Match It state: selectedTerm=index of clicked term, matches=term index → def index
  const [shuffledDefs] = useState(() => {
    const items = (ws.match_it ?? []).map((m, i) => ({ def: m.definition, origIdx: i }));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  });
  const [selectedTerm, setSelectedTerm]   = useState<number | null>(null);
  const [matchPairs, setMatchPairs]       = useState<Record<number, number>>({}); // termIdx → shuffledDefIdx
  const [matchChecked, setMatchChecked]   = useState(false);

  function handleTermClick(i: number) {
    if (matchChecked) return;
    setSelectedTerm(prev => prev === i ? null : i);
  }

  function handleDefClick(j: number) {
    if (matchChecked || selectedTerm === null) return;
    setMatchPairs(p => ({ ...p, [selectedTerm]: j }));
    setSelectedTerm(null);
  }

  function checkMatch() { setMatchChecked(true); }
  function resetMatch() { setMatchPairs({}); setMatchChecked(false); setSelectedTerm(null); }

  const wsHtml = buildWorksheetHtml(ws, topic, false);
  const ansHtml = buildWorksheetHtml(ws, topic, true);

  return (
    <div className="space-y-5">
      <FeatureBanner
        emoji="📝"
        title="Practice Questions"
        desc="Fill blanks · true/false · match pairs · short answers · Ilm checks your work — hands-on learning"
        className="bg-[#E8F4FD] border-[#1A5C96] text-[#004D40]"
      />
      <div className="bg-white rounded-2xl border border-sand-mid p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <div>
            <h3 className="font-serif font-bold text-bark-deep text-xl">{ws.title}</h3>
            <p className="text-bark-soft text-sm italic mt-0.5">{ws.instructions}</p>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <DownloadBar
              title={`Worksheet — ${topic}`}
              htmlBody={wsHtml.match(/<body>([\s\S]*)<\/body>/i)?.[1] ?? wsHtml}
              accentColor="#1A5C96"
              trackTopic="Practice Questions"
            />
            <button type="button" onClick={() => dlBlob(ansHtml, `answers-${topic}.html`)}
              className="text-[10px] text-sage-hi font-semibold hover:underline">
              ⬇ Teacher answer sheet (.html)
            </button>
          </div>
        </div>
        {(ws.word_bank ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-bark-faint mr-1">Word bank:</span>
            {(ws.word_bank ?? []).map((w, i) => (
              <span key={i} className="bg-dust-lo text-dust-hi px-2.5 py-0.5 rounded-full text-xs font-bold">{w}</span>
            ))}
          </div>
        )}
      </div>

      {/* Part A — Fill in the blanks (interactive) */}
      {(ws.fill_blanks ?? []).length > 0 && (
        <div className="bg-parch rounded-2xl border border-sand-mid p-5">
          <p className="text-xs font-bold text-bark-faint uppercase tracking-wider mb-4">Part A · Fill in the Blanks</p>
          <div className="space-y-4">
            {(ws.fill_blanks ?? []).map((fb, i) => {
              const parts = fb.sentence.split(/_{2,}/);
              const checked = fillChecked[i];
              const correct = fillAnswers[i]?.trim().toLowerCase() === fb.answer.toLowerCase();
              return (
                <div key={i} className="bg-white rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-dust text-white text-xs rounded-full flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    <div className="flex-1 flex flex-wrap items-center gap-1 text-sm text-bark-deep leading-loose">
                      <span>{parts[0]}</span>
                      <input
                        type="text"
                        value={fillAnswers[i] ?? ""}
                        onChange={e => { setFillAnswers(a => ({...a, [i]: e.target.value})); setFillChecked(c => ({...c, [i]: false})); }}
                        placeholder="type here…"
                        className={`inline-block border-b-2 bg-transparent px-1 focus:outline-none min-w-[80px] max-w-[160px] text-center text-sm transition-colors ${
                          checked ? correct ? "border-sage text-sage" : "border-terra text-terra-hi" : "border-dust text-bark-deep"
                        }`}
                      />
                      {parts[1] && <span>{parts[1]}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-9">
                    <button onClick={() => setFillChecked(c => ({...c, [i]: true}))}
                      disabled={!fillAnswers[i]?.trim()}
                      className="text-[10px] bg-dust-lo text-dust-hi px-2.5 py-1 rounded-full font-semibold hover:bg-dust hover:text-white transition-colors disabled:opacity-40">
                      Check
                    </button>
                    {checked && (
                      <span className={`text-xs font-semibold ${correct ? "text-sage" : "text-terra-hi"}`}>
                        {correct ? "✓ Correct!" : `✗ Answer: ${fb.answer}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Part B — True / False */}
      {(ws.true_false ?? []).length > 0 && (
        <div className="bg-parch rounded-2xl border border-sand-mid p-5">
          <p className="text-xs font-bold text-bark-faint uppercase tracking-wider mb-4">Part B · True or False</p>
          <div className="space-y-3">
            {(ws.true_false ?? []).map((tf, i) => (
              <div key={i} className="bg-white rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-terra text-white text-xs rounded-full flex items-center justify-center shrink-0 font-bold">{i+1}</span>
                  <p className="text-bark-deep text-sm flex-1">{tf.statement}</p>
                </div>
                <div className="flex gap-2 mt-2 ml-9">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setTfAnswers(a => ({...a, [i]: v}))}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-2 ${
                        tfAnswers[i] === v
                          ? v === tf.answer ? "bg-sage text-white border-sage" : "bg-terra-lo text-terra-hi border-terra"
                          : "bg-sand text-bark-soft border-sand-mid hover:border-dust"
                      }`}>
                      {v ? "True" : "False"}
                    </button>
                  ))}
                </div>
                {tfAnswers[i] !== undefined && tfAnswers[i] !== null && (
                  <p className={`mt-2 ml-9 text-xs ${tfAnswers[i] === tf.answer ? "text-sage" : "text-terra-hi"}`}>
                    {tfAnswers[i] === tf.answer ? "✓ Correct! " : "✗ Not quite. "}{tf.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Part C — Short Answer (AI-checked) */}
      {(ws.short_answer ?? []).length > 0 && (
        <div className="bg-parch rounded-2xl border border-sand-mid p-5">
          <p className="text-xs font-bold text-bark-faint uppercase tracking-wider mb-1">Part C · Short Answer</p>
          <p className="text-bark-faint text-[10px] mb-4">Ilm will read your answer and give you feedback ✦</p>
          <div className="space-y-4">
            {(ws.short_answer ?? []).map((sa, i) => (
              <ShortAnswerItem key={i} sa={sa} index={i} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* Part D — Match It (click-to-connect) */}
      {(ws.match_it ?? []).length > 0 && (
        <div className="bg-parch rounded-2xl border border-sand-mid p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-bark-faint uppercase tracking-wider">Part D · Match It</p>
            <div className="flex gap-2">
              {matchChecked && (
                <button onClick={resetMatch} className="text-[10px] text-bark-faint hover:text-bark-deep transition-colors">Reset</button>
              )}
              {!matchChecked && Object.keys(matchPairs).length === (ws.match_it ?? []).length && (
                <button onClick={checkMatch}
                  className="text-[10px] bg-sage text-white px-2.5 py-1 rounded-full font-semibold hover:opacity-80">
                  Check answers
                </button>
              )}
            </div>
          </div>
          {selectedTerm !== null && (
            <p className="text-xs text-dust font-semibold mb-3 animate-pulse-dot">
              Now click a definition to match with &ldquo;{(ws.match_it ?? [])[selectedTerm]?.term}&rdquo;
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-bark-soft mb-1">Terms — click to select</p>
              {(ws.match_it ?? []).map((m, i) => {
                const paired = matchPairs[i] !== undefined;
                const isSelected = selectedTerm === i;
                const pairedDef = paired ? shuffledDefs[matchPairs[i]] : null;
                const isCorrect = matchChecked && paired && pairedDef?.origIdx === i;
                const isWrong   = matchChecked && paired && pairedDef?.origIdx !== i;
                return (
                  <button key={i} onClick={() => handleTermClick(i)}
                    disabled={matchChecked}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-all ${
                      isCorrect ? "border-sage bg-sage-lo text-sage-hi" :
                      isWrong   ? "border-terra bg-terra-lo text-terra-hi" :
                      isSelected ? "border-dust bg-dust-lo text-dust-hi ring-2 ring-dust" :
                      paired    ? "border-bark-faint bg-sand text-bark-deep" :
                      "border-dust-lo bg-white hover:border-dust hover:bg-dust-lo text-bark-deep"
                    }`}>
                    {String.fromCharCode(65+i)}. {m.term}
                    {paired && !matchChecked && <span className="ml-2 text-[10px] text-bark-faint">(matched)</span>}
                    {isCorrect && <span className="ml-2">✓</span>}
                    {isWrong && <span className="ml-2">✗</span>}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-bark-soft mb-1">Definitions — click to match</p>
              {shuffledDefs.map((item, j) => {
                const isPaired = Object.values(matchPairs).includes(j);
                const pairedTermIdx = Object.entries(matchPairs).find(([, v]) => v === j)?.[0];
                const isCorrect = matchChecked && pairedTermIdx !== undefined && item.origIdx === Number(pairedTermIdx);
                const isWrong   = matchChecked && pairedTermIdx !== undefined && item.origIdx !== Number(pairedTermIdx);
                return (
                  <button key={j} onClick={() => handleDefClick(j)}
                    disabled={matchChecked || (isPaired && selectedTerm === null)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm border-2 transition-all ${
                      isCorrect ? "border-sage bg-sage-lo text-sage-hi" :
                      isWrong   ? "border-terra bg-terra-lo text-terra-hi" :
                      isPaired  ? "border-bark-faint bg-sand text-bark-deep" :
                      selectedTerm !== null ? "border-dust bg-dust-lo text-bark-deep hover:border-dust-hi cursor-pointer" :
                      "border-sand-mid bg-white text-bark-deep"
                    }`}>
                    {item.def}
                    {isCorrect && <span className="ml-2 text-sage font-bold">✓</span>}
                    {isWrong && <span className="ml-2 text-terra-hi font-bold">✗</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {matchChecked && (
            <div className="mt-3 p-3 bg-sand rounded-xl">
              <p className="text-xs font-semibold text-bark-deep">
                Score: {Object.entries(matchPairs).filter(([ti, di]) => shuffledDefs[di]?.origIdx === Number(ti)).length} / {(ws.match_it ?? []).length} correct
              </p>
            </div>
          )}
        </div>
      )}

      {/* Challenge */}
      {ws.challenge && (
        <div className="bg-honey-lo rounded-2xl border-2 border-honey p-5">
          <p className="text-xs font-bold text-bark-deep uppercase tracking-wider mb-1">🌟 {ws.challenge.title}</p>
          <p className="text-bark-deep text-sm leading-relaxed">{ws.challenge.prompt}</p>
        </div>
      )}
    </div>
  );
}

/* ── Upload Zone ────────────────────────────────────────────── */
type UploadedFile = { name: string; fileId: string; preview?: string };

function UploadZone({ onFile, disabled }: { onFile: (fileId: string, name: string) => void; disabled?: boolean }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [files, setFiles]         = useState<UploadedFile[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);
  const cameraRef                 = useRef<HTMLInputElement>(null);

  async function accept(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true); setError(null);
    for (const file of Array.from(fileList)) {
      try {
        let preview: string | undefined;
        if (file.type.startsWith("image/")) {
          preview = await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
        const res = await api.uploadFile(file);
        setFiles(prev => {
          const updated = [...prev, { name: file.name, fileId: res.file_id, preview }];
          const newIdx = updated.length - 1;
          setActiveIdx(newIdx);
          onFile(res.file_id, file.name);
          return updated;
        });
      } catch { setError("One or more files failed to upload"); }
    }
    setUploading(false);
  }

  function selectFile(idx: number) {
    setActiveIdx(idx);
    onFile(files[idx].fileId, files[idx].name);
  }

  function removeFile(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0) { const ni = Math.min(idx, next.length - 1); setActiveIdx(ni); onFile(next[ni].fileId, next[ni].name); }
      else setActiveIdx(null);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files); }}
        onClick={() => !uploading && !disabled && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${dragging ? "border-sage bg-sage-lo" : "border-sand-mid hover:border-sage hover:bg-sage-lo"} ${uploading || disabled ? "opacity-60 cursor-wait" : "cursor-pointer"}`}>
        <input ref={fileRef} type="file" multiple accept=".pdf,.mp3,.wav,.jpg,.jpeg,.png,.docx"
          onChange={e => accept(e.target.files)} className="hidden" />
        {uploading ? (
          <div className="space-y-2">
            <div className="w-10 h-10 border-2 border-sage border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-bark-soft text-sm">Uploading…</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 bg-sand rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-bark-soft" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="font-semibold text-bark-deep text-sm">Drop files here or click to browse</p>
            <p className="text-bark-faint text-xs">PDF · DOCX · MP3 · WAV · JPG · PNG · Multiple files OK</p>
          </div>
        )}
        {error && <p className="mt-2 text-terra-hi text-xs">{error}</p>}
      </div>

      {/* Uploaded file list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <button key={f.fileId} onClick={() => selectFile(i)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 text-left transition-all ${
                activeIdx === i ? "border-sage bg-sage-lo" : "border-sand-mid bg-white hover:border-sage"
              }`}>
              {f.preview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={f.preview} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-sand-mid" />
                : <span className="w-8 h-8 bg-dust-lo rounded-lg flex items-center justify-center text-dust text-xs shrink-0">
                    {f.name.endsWith(".pdf") ? "PDF" : f.name.endsWith(".mp3") || f.name.endsWith(".wav") ? "🎵" : "📄"}
                  </span>
              }
              <span className="flex-1 text-bark-deep text-xs font-medium truncate">{f.name}</span>
              {activeIdx === i && <span className="text-sage text-xs font-bold shrink-0">Active</span>}
              <button onClick={e => removeFile(i, e)} className="text-bark-faint hover:text-terra-hi transition-colors text-xs shrink-0 ml-1">✕</button>
            </button>
          ))}
        </div>
      )}

      {/* Camera button — uses device camera on mobile */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-sand-mid" />
        <span className="text-bark-faint text-xs">or</span>
        <div className="flex-1 h-px bg-sand-mid" />
      </div>
      <button onClick={() => !uploading && !disabled && cameraRef.current?.click()}
        disabled={uploading || disabled}
        className="w-full flex items-center justify-center gap-2 bg-sand border border-sand-mid rounded-2xl px-4 py-3 text-bark-soft text-sm font-medium hover:bg-sand-mid hover:text-bark-deep transition-all disabled:opacity-50">
        <span className="text-xl">📷</span>
        Take a Photo
        <span className="text-[10px] text-bark-faint">(mobile camera)</span>
      </button>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        onChange={e => accept(e.target.files)} className="hidden" />
    </div>
  );
}


/* ── TTS helper (browser speechSynthesis) ───────────────────── */
function speakText(text: string, lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const langMap: Record<string, string> = { en: "en-MY", ms: "ms-MY", zh: "zh-CN", ta: "ta-IN" };
  // Strip emojis, bullets, markdown symbols before speaking
  const clean = text
    .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FEFF}]/gu, "")
    .replace(/[•*#_~`[\]()]/g, "")
    .replace(/\s+/g, " ").trim();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = langMap[lang] ?? "en-MY";
  utter.rate = 0.92;
  window.speechSynthesis.speak(utter);
}

/* ── Mood Check-In Overlay ──────────────────────────────────── */
const MOOD_OPTIONS = [
  { key: "good",     emoji: "😊", label: "Good",     desc: "Ready to learn!",       bg: "bg-sage-lo",   accent: "border-sage",    text: "text-sage-hi",    greeting: "You're on fire today! Let's make something click." },
  { key: "okay",     emoji: "😐", label: "Okay",     desc: "Let's go at our pace",  bg: "bg-cream",     accent: "border-sand-mid",text: "text-bark-soft",  greeting: "No worries — we go at your pace, always." },
  { key: "tired",    emoji: "😔", label: "Tired",    desc: "Short & gentle mode",   bg: "bg-dust-lo",   accent: "border-dust",    text: "text-dust-hi",    greeting: "Take it easy, we'll keep things short and simple today." },
  { key: "stressed", emoji: "😤", label: "Stressed", desc: "Extra support mode",    bg: "bg-terra-lo",  accent: "border-terra",   text: "text-terra-hi",   greeting: "It's okay — Ilm's got you. Breathe, and let's take it one step at a time." },
];

function MoodCheckIn({ onSelect }: { onSelect: (mood: string) => void }) {
  return (
    <div className="fixed inset-0 bg-cream z-50 flex flex-col items-center justify-center p-6">
      <Link href="/" className="absolute top-5 left-5 flex items-center gap-1.5 text-bark-faint hover:text-bark-deep transition-colors text-sm font-medium">
        ← Back
      </Link>
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="w-16 h-16 bg-sage rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-white text-3xl font-bold">✦</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-bark-deep">Welcome to ilm.io</h1>
          <p className="text-bark-soft mt-2 text-base leading-relaxed">
            How are you feeling right now?<br />
            <span className="text-bark-faint text-sm">I&apos;ll adjust how I explain things to match your energy.</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MOOD_OPTIONS.map(m => (
            <button key={m.key} onClick={() => onSelect(m.key)}
              className="bg-parch border-2 border-sand-mid rounded-2xl p-5 text-center hover:border-sage hover:bg-sage-lo transition-all group">
              <div className="text-4xl mb-2">{m.emoji}</div>
              <p className="font-bold text-bark-deep text-base group-hover:text-sage-hi">{m.label}</p>
              <p className="text-bark-faint text-xs mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
        <p className="text-bark-faint text-xs">You can change this anytime during your session.</p>
      </div>
    </div>
  );
}


/* ── Explain Style Panel ────────────────────────────────────── */
/* ── Page ───────────────────────────────────────────────────── */
export default function StudentDashboard() {
  const [fileId, setFileId]     = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [lang, setLang]         = useState<Language>("en");
  const [step, setStep]         = useState<PipelineStep>("idle");
  const [pockets, setPockets]   = useState<PocketsResponse | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  // Mood check-in
  const [mood, setMood]               = useState("okay");
  const [moodCheckedIn, setMoodCheckedIn] = useState(false);

  // Focus mode
  const [focusMode, setFocusMode]     = useState(false);

  type OutputState =
    | { kind: "adhd";      data: AgentSlidesResponse }
    | { kind: "autism";    data: AgentSlidesResponse }
    | { kind: "dyslexia";  data: AgentSlidesResponse }
    | { kind: "mindmap";   data: MindmapResponse }
    | { kind: "worksheet"; data: ExaminerWorksheetResponse }
    | null;

  const [activeOutput, setActiveOutput]     = useState<OutputKind | null>(null);
  const [output, setOutput]                 = useState<OutputState>(null);
  const [genMessage, setGenMessage]         = useState(0);
  const [truncatedWarning, setTruncatedWarning] = useState(false);
  const stageTimers                         = useRef<ReturnType<typeof setTimeout>[]>([]);
  const langMounted                         = useRef(false);
  const [translating, setTranslating]       = useState(false);

  const GEN_MESSAGES = [
    "Reading your document…",
    "Adapting for your learning style…",
    "Almost ready…",
  ];

  useEffect(() => {
    if (step !== "generating") return;
    setGenMessage(0);
    const id = setInterval(() => setGenMessage(m => (m + 1) % GEN_MESSAGES.length), 2000);
    return () => clearInterval(id);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (!langMounted.current) { langMounted.current = true; return; }
    if (!fileId || step !== "done" || !activeOutput || translating) return;
    setTranslating(true);
    (async () => {
      try {
        if (activeOutput === "adhd") {
          const r = await api.agentStudentADHDSlides(fileId, lang);
          setOutput({ kind: "adhd", data: r as AgentSlidesResponse });
        } else if (activeOutput === "autism") {
          const r = await api.agentStudentAutismSlides(fileId, lang);
          setOutput({ kind: "autism", data: r as AgentSlidesResponse });
        } else if (activeOutput === "dyslexia") {
          const r = await api.agentDyslexiaSlides(fileId, lang);
          setOutput({ kind: "dyslexia", data: r });
        } else if (activeOutput === "mindmap") {
          const r = await api.agentVisualMindmap(fileId, lang);
          setOutput({ kind: "mindmap", data: r });
        } else if (activeOutput === "worksheet") {
          const r = await api.agentExaminerWorksheet(fileId, lang);
          setOutput({ kind: "worksheet", data: r });
        }
      } catch { /* keep existing output on failure */ }
      finally { setTranslating(false); }
    })();
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(id: string, name: string) {
    setFileId(id); setFileName(name);
    setPockets(null); setPipelineError(null); setOutput(null); setActiveOutput(null);
    setStep("reading");
    try {
      const p = await api.agentRead(id, lang);
      setPockets(p); setStep("ready");
      trackEvent("upload", { topic: p.topic, filename: name });
    } catch (e) {
      setPipelineError(e instanceof Error ? e.message : "Reader Agent failed");
      setStep("error");
    }
  }

  async function generate(kind: OutputKind) {
    if (!fileId || step === "generating") return;
    setActiveOutput(kind); setOutput(null); setStep("generating");

    try {
      if (kind === "adhd") {
        const r = await api.agentStudentADHDSlides(fileId, lang);
        setOutput({ kind: "adhd", data: r as AgentSlidesResponse });
        trackEvent("slide_view", { topic: "Focus Slides", difficulty: 3 });
      } else if (kind === "autism") {
        const r = await api.agentStudentAutismSlides(fileId, lang);
        setOutput({ kind: "autism", data: r as AgentSlidesResponse });
        trackEvent("slide_view", { topic: "Clear & Calm Slides", difficulty: 3 });
      } else if (kind === "dyslexia") {
        const r = await api.agentDyslexiaSlides(fileId, lang);
        setOutput({ kind: "dyslexia", data: r });
        trackEvent("slide_view", { topic: "Easy Read Slides", difficulty: 2 });
      } else if (kind === "mindmap") {
        const r = await api.agentVisualMindmap(fileId, lang);
        setOutput({ kind: "mindmap", data: r });
        trackEvent("slide_view", { topic: "Visual Mind Map", difficulty: 2 });
      } else {
        const r = await api.agentExaminerWorksheet(fileId, lang);
        setOutput({ kind: "worksheet", data: r });
        trackEvent("quiz_answer", { topic: "Practice Questions", difficulty: 2 });
      }
      setStep("done");
    } catch (e) {
      setPipelineError(e instanceof Error ? e.message : "Agent failed");
      setStep("error");
    } finally {
      stageTimers.current.forEach(clearTimeout);
      stageTimers.current = [];
    }
  }

  const OUTPUT_BUTTONS: { kind: OutputKind; emoji: string; label: string; sub: string; color: string; active: string; helps: string[] }[] = [
    { kind:"adhd",      emoji:"🧩", label:"Focus Slides",        sub:"Timers · colour themes · one idea per slide · PPTX / PDF / PNG",       helps:["ADHD"],     color:"border-dust-lo bg-white hover:border-dust hover:bg-dust-lo",           active:"border-dust bg-dust-lo" },
    { kind:"autism",    emoji:"🗂️", label:"Clear & Calm Slides", sub:"Navy layout · What/Details/Why · same structure every slide",          helps:["Autism"],   color:"border-honey-lo bg-white hover:border-honey hover:bg-honey-lo",         active:"border-honey bg-honey-lo" },
    { kind:"dyslexia",  emoji:"📖", label:"Easy Read Slides",    sub:"Huge text · yellow key phrases · bionic-friendly · all formats",       helps:["Dyslexia"], color:"border-[#E8F4FD] bg-white hover:border-[#1A5C96] hover:bg-[#E8F4FD]", active:"border-[#1A5C96] bg-[#E8F4FD]" },
    { kind:"mindmap",   emoji:"🗺️", label:"Visual Mind Map",     sub:"Hub-and-spoke branches · colour-coded · expand to explore",            helps:["Visual"],   color:"border-terra-lo bg-white hover:border-terra hover:bg-terra-lo",       active:"border-terra bg-terra-lo" },
    { kind:"worksheet", emoji:"📝", label:"Practice Questions",  sub:"Fill blanks · T/F · matching · Ilm checks answers · download",       helps:["Hands-on"], color:"border-violet-200 bg-white hover:border-violet-500 hover:bg-violet-50", active:"border-violet-500 bg-violet-50" },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-700 relative ${MOOD_OPTIONS.find(m => m.key === mood)?.bg ?? "bg-cream"}`}>

      <FloatingLeaves />

      {/* ── Mood Check-In overlay ─────────────────────── */}
      {!moodCheckedIn && (
        <MoodCheckIn onSelect={m => { setMood(m); setMoodCheckedIn(true); }} />
      )}

      {/* ── Focus Mode overlay ──────────────────────────── */}
      {focusMode && (
        <div className="fixed inset-0 bg-bark-deep/80 z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-parch rounded-3xl p-6 border border-sand-mid">
            <div className="flex items-center justify-between mb-4">
              <p className="font-serif font-semibold text-bark-deep">Focus Mode</p>
              <button onClick={() => setFocusMode(false)}
                className="px-3 py-1.5 bg-sand rounded-xl text-xs text-bark-soft hover:bg-sand-mid transition-colors">
                Exit Focus Mode
              </button>
            </div>
            {step === "done" && output?.kind === "adhd"      && <ADHDPanel result={output.data} />}
            {step === "done" && output?.kind === "autism"    && <AutismPanel result={output.data} />}
            {step === "done" && output?.kind === "dyslexia"  && <DyslexiaSlidesPanel result={output.data} />}
            {step === "done" && output?.kind === "mindmap"   && <MindmapPanel result={output.data} />}
            {step === "done" && output?.kind === "worksheet" && <WorksheetPanel result={output.data} lang={lang} />}
          </div>
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-bark-deep/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Profile sidebar ──────────────────────────── */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-parch border-r border-sand-mid flex flex-col p-6 shrink-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-sage rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">✦</span>
            </div>
            <span className="font-serif text-xl font-semibold text-bark-deep group-hover:text-sage-hi transition-colors">ilm.io</span>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-bark-soft hover:text-bark-deep rounded-lg">✕</button>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-1 text-bark-faint hover:text-bark-deep transition-colors text-xs font-medium mb-5 w-fit">
          ← Back to home
        </Link>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-20 h-20 bg-sage-mid rounded-full flex items-center justify-center text-4xl mb-3">🌱</div>
          <p className="font-semibold text-bark-deep text-lg">My Learning</p>
          <span className="mt-1 px-3 py-0.5 bg-sage-lo text-sage-hi rounded-full text-xs font-medium">Student Mode</span>
        </div>

        {/* Language selector */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-bark-faint uppercase tracking-wider mb-2">Language</p>
          <div className="grid grid-cols-2 gap-1.5">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium transition-all ${lang === l.code ? "bg-sage text-white" : "bg-sand text-bark-soft hover:bg-sand-mid"}`}>
                <span>{l.flag}</span><span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline status */}
        {step !== "idle" && (
          <div className="mb-4 p-3 bg-sand rounded-xl">
            <p className="text-xs font-semibold text-bark-faint uppercase tracking-wide mb-2">Pipeline Status</p>
            <PipelineIndicator step={step} />
            {step === "reading"    && <p className="text-bark-soft text-xs mt-2 animate-pulse">Reader Agent analysing…</p>}
            {step === "generating" && <p className="text-bark-soft text-xs mt-2 animate-pulse">Agent generating…</p>}
            {step === "done"       && <p className="text-sage text-xs mt-2 font-medium">✓ {fileName}</p>}
            {step === "error"      && <p className="text-terra-hi text-xs mt-2">{pipelineError}</p>}
          </div>
        )}

        {/* About */}
        <div className="bg-dust-lo rounded-2xl p-4 flex-1 min-h-0 overflow-y-auto">
          <p className="text-xs font-semibold text-dust-hi uppercase tracking-wider mb-3">Agents on standby</p>
          <div className="space-y-2">
            {[
              { icon: "📖", name: "Reader", desc: "Knowledge pockets" },
              { icon: "🧩", name: "Focus Slides", desc: "ADHD format" },
              { icon: "🗂️", name: "Clear & Calm", desc: "Autism format" },
              { icon: "📖", name: "Easy Read", desc: "Dyslexia format" },
              { icon: "🗺️", name: "Mind Map", desc: "Visual branches" },
              { icon: "📝", name: "Examiner", desc: "Practice questions" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-base">{a.icon}</span>
                <div>
                  <p className="text-bark-deep text-xs font-semibold">{a.name}</p>
                  <p className="text-bark-faint text-[10px]">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-2 bg-parch rounded-2xl px-3 py-3 border border-sand-mid">
            <Link href="/" className="flex items-center gap-1 text-bark-soft hover:text-bark-deep transition-colors shrink-0 text-xs font-semibold px-2 py-1.5 bg-sand rounded-xl hover:bg-sand-mid">
              ← Home
            </Link>
            <div className="flex-1 min-w-0 text-center">
              <p className="font-serif font-semibold text-bark-deep text-sm">ilm.io · Student</p>
            </div>
            <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"
              className="w-9 h-9 bg-sand rounded-xl flex items-center justify-center text-bark-deep shrink-0 hover:bg-sand-mid transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          {/* Mood banner */}
          {(() => {
            const m = MOOD_OPTIONS.find(o => o.key === mood);
            if (!m) return null;
            return (
              <div className={`rounded-2xl border-2 ${m.accent} px-4 py-3 flex items-center gap-3 transition-all`}>
                <span className="text-3xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${m.text}`}>{m.greeting}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setMoodCheckedIn(false)} title="Change mood"
                    className={`text-xs font-medium px-2.5 py-1 rounded-xl border ${m.accent} ${m.text} hover:opacity-70 transition-opacity`}>
                    Change
                  </button>
                  {step === "done" && (
                    <button onClick={() => setFocusMode(true)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-xl border ${m.accent} ${m.text} hover:opacity-70 transition-opacity`}>
                      Focus mode
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-bark-deep">Hi there! Let&apos;s learn together.</h1>
            <p className="text-bark-soft mt-1 text-sm">Upload your material — ilm.io will turn it into what works best for you.</p>
          </div>

          {/* Step 1 — Upload */}
          <div className="bg-parch rounded-3xl p-5 border border-sand-mid">
            <h2 className="font-semibold text-bark-deep mb-4">📤 Step 1 — Upload your material</h2>
            <UploadZone onFile={handleUpload} disabled={step === "reading" || step === "generating"} />
          </div>

          {/* Reading loader */}
          {step === "reading" && (
            <div className="bg-parch rounded-3xl p-8 border border-sand-mid flex flex-col items-center gap-4 animate-fade-up">
              <div className="relative w-16 h-16 shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-sage-lo" />
                <div className="absolute inset-0 rounded-full border-4 border-sage border-t-transparent animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl">📖</span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-bark-deep mb-1">Reader Agent is scanning your document…</p>
                <p className="text-bark-faint text-sm leading-relaxed">Extracting knowledge pockets. This takes about 15–30 seconds.</p>
              </div>
              <div className="flex gap-2 mt-1">
                {["Reading content","Identifying concepts","Forming pockets"].map((label, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-sage-lo rounded-full">
                    <span className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse-dot" style={{ animationDelay: `${i*250}ms` }} />
                    <span className="text-sage-hi text-[10px] font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Pockets preview */}
          {pockets && (
            <div className="bg-parch rounded-3xl p-5 border border-sand-mid">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-sage rounded-full" />
                <h2 className="font-semibold text-bark-deep">Step 2 — Reader found {pockets.pockets.length} concepts</h2>
              </div>
              <p className="text-bark-faint text-xs mb-4 pl-4">from <span className="font-medium text-bark-deep">{pockets.topic}</span></p>

              <div className="bg-sand rounded-2xl p-4 mb-4">
                <p className="text-bark-soft text-xs font-semibold uppercase tracking-wide mb-1">Summary</p>
                <p className="text-bark-deep text-sm leading-relaxed">{pockets.summary}</p>
              </div>

              {pockets.vocabulary.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {pockets.vocabulary.map((v, i) => (
                    <span key={i} title={v.definition}
                      className="bg-white border border-sand-mid text-bark-deep text-xs px-2.5 py-1 rounded-full cursor-default hover:bg-sand transition-colors">
                      {v.term}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {pockets.pockets.map(p => <PocketCard key={p.id} pocket={p} />)}
              </div>
            </div>
          )}

          {/* Step 3 — Select output */}
          {pockets && (
            <div className="bg-parch rounded-3xl p-5 border border-sand-mid">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-dust rounded-full" />
                <h2 className="font-semibold text-bark-deep">Step 3 — Choose your learning format</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {OUTPUT_BUTTONS.map(btn => (
                  <button key={btn.kind} onClick={() => generate(btn.kind)}
                    disabled={step === "generating"}
                    className={`rounded-3xl p-4 text-left border-2 transition-all ${
                      activeOutput === btn.kind && step !== "idle" ? btn.active : btn.color
                    } ${step === "generating" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                    <div className="text-2xl mb-2">{btn.emoji}</div>
                    <p className="font-bold text-bark-deep text-sm mb-1">{btn.label}</p>
                    <p className="text-bark-faint text-xs leading-relaxed mb-2">{btn.sub}</p>
                    <div className="flex flex-wrap gap-1">
                      {btn.helps.map(c => (
                        <span key={c} className="text-[9px] bg-white/70 text-bark-soft px-1.5 py-0.5 rounded-full font-semibold border border-bark-faint/20">
                          {c} ✓
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-bark-faint text-xs mt-4 text-center">
                Need a summary or quiz? Open <strong>Ilm</strong> (bottom right) for actions — not just chat.
              </p>
            </div>
          )}

          {/* Truncation warning banner */}
          {truncatedWarning && (
            <div className="bg-[#FFF8E1] border border-[#FFB300] rounded-2xl px-4 py-3 flex items-start gap-3">
              <span className="text-[#FFB300] text-lg shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-bark-deep text-sm font-medium">Your document was long — we used the first part.</p>
                <p className="text-bark-soft text-xs mt-0.5">For best results, try uploading shorter sections.</p>
              </div>
              <button onClick={() => setTruncatedWarning(false)} className="text-bark-faint text-xs hover:text-bark-deep shrink-0">✕</button>
            </div>
          )}

          {/* Step 4 — Output */}
          {(step === "generating" || step === "done" || step === "error") && (
            <div className="relative bg-parch rounded-3xl p-5 border border-sand-mid">
              {translating && <TranslatingOverlay />}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-dust rounded-full" />
                <h2 className="font-semibold text-bark-deep">Step 4 — Your output</h2>
              </div>

              {step === "generating" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-sand rounded-2xl">
                    <div className="w-6 h-6 border-2 border-dust border-t-transparent rounded-full animate-spin shrink-0" />
                    <div>
                      <p className="text-bark-deep text-sm font-medium transition-all">
                        {GEN_MESSAGES[genMessage]}
                      </p>
                      <p className="text-bark-faint text-xs">
                        {OUTPUT_BUTTONS.find(b => b.kind === activeOutput)?.label ?? "Generating"} · 20–40 seconds
                      </p>
                    </div>
                  </div>
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl shimmer" />)}
                </div>
              )}

              {step === "error" && (
                <div className="bg-terra-lo rounded-2xl p-4">
                  <p className="text-terra-hi font-semibold text-sm mb-1">Agent failed</p>
                  <p className="text-bark-deep text-sm">{pipelineError}</p>
                  <button onClick={() => { setStep("ready"); setPipelineError(null); }}
                    className="mt-3 text-xs text-terra-hi font-medium hover:underline">← Back to selection</button>
                </div>
              )}

              {step === "done" && output?.kind === "adhd"      && <ADHDPanel result={output.data} />}
              {step === "done" && output?.kind === "autism"    && <AutismPanel result={output.data} />}
              {step === "done" && output?.kind === "dyslexia"  && <DyslexiaSlidesPanel result={output.data} />}
              {step === "done" && output?.kind === "mindmap"   && <MindmapPanel result={output.data} />}
              {step === "done" && output?.kind === "worksheet" && <WorksheetPanel result={output.data} lang={lang} />}
            </div>
          )}
        </div>
      </main>

      <StudentIlmChat fileId={fileId} pockets={pockets} mood={mood} lang={lang} />
    </div>
  );
}
