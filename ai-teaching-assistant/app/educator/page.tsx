"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type {
  StudentProfile, WeeklyReport,
  PocketsResponse, ADHDSlide, AutismSlide, DyslexiaSlide, TranscribeResponse,
  AgentSlidesResponse, Language, HeatmapCell,
  AgentWorksheetResponse, AgentQuizResponse, StudentObserverResult,
} from "@/lib/api";
import { EducatorIlmChat } from "@/app/components/EducatorIlmChat";
import { ILM_ASSISTANT_PAGE_EVENT } from "@/lib/ilm-assistant-actions";
import { TranslatingOverlay } from "@/app/components/TranslatingOverlay";
import { trackEvent, DEMO_STUDENT_ID } from "@/lib/track";
import { DEMO_CLASS_ROSTER } from "@/lib/demo-class";
import { GENERAL_CLASS_ID, isGeneralClassSelection } from "@/lib/educator-class";
import { SlideVisual } from "@/app/components/SlideVisual";
import {
  recommendedFormatForCondition,
  educatorOutputButtonClass,
} from "@/lib/ilm-formats";
import { getEducatorOutputOptions, getFormatLabel } from "@/lib/localized-formats";
import { FORMAT_COPY, EDUCATOR_FORMAT_TIPS } from "@/lib/ui-strings-formats";
import { useIlmLanguage } from "@/lib/ilm-language";
import { useUiStrings } from "@/lib/use-ui-strings";
import { IlmLanguageSelect } from "@/app/components/ilm/IlmLanguageSelect";
import { SimplePocketList } from "@/app/components/SimplePocketList";
import { FormatBadge } from "@/app/components/ilm/FormatBadge";
import { IlmLogo } from "@/app/components/ilm/IlmLogo";
import { EducatorSidebar } from "@/app/components/EducatorSidebar";

const EDUCATOR_SIDEBAR_KEY = "ilmio_educator_sidebar";

/* Constants */
import { apiFetchHeaders, apiUrl } from "@/lib/api-base";

function dlBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function buildEducatorWorksheetHtml(ws: import("@/lib/api").AgentWorksheetResponse["worksheet"], topic: string, showAnswers: boolean): string {
  const blank = `<span style="display:inline-block;border-bottom:2px solid #555;min-width:90px;margin:0 4px">&nbsp;</span>`;
  const ansSpan = (a: string) => `<span style="color:#2c7a2c;font-weight:bold"> ${a}</span>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${showAnswers ? "Answer Sheet" : "Worksheet"} — ${topic}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:750px;margin:40px auto;padding:0 24px;color:#333;line-height:1.7}
  h1{font-size:22px;border-bottom:2px solid #8FA68E;padding-bottom:8px}
  h2{font-size:15px;background:#EDE5D8;padding:6px 12px;border-radius:6px;margin-top:24px}
  .item{margin:8px 0;padding:10px 14px;background:#F7F3EC;border-radius:6px;font-size:14px}
  .line{border-bottom:1px solid #ccc;margin:10px 0;height:20px}
  @media print{body{margin:20px}}
</style></head><body>
<h1>${ws.title}${showAnswers ? " — Answer Sheet" : ""}</h1>
${(ws.sections ?? []).map(sec => `<h2>${sec.title}</h2>
<p style="font-size:13px;color:#888;margin-bottom:8px">${sec.instructions ?? ""}</p>
${(sec.items ?? []).map((item, i) => {
  const q = typeof item === "string" ? item : item.question;
  const a = typeof item === "string" ? "" : item.answer;
  const displayQ = showAnswers
    ? q.replace(/_{2,}/g, ansSpan(a))
    : q.replace(/_{2,}/g, blank);
  const hasBlank = /_{2,}/.test(q);
  return `<div class="item">${i+1}. ${displayQ}${showAnswers && a && !hasBlank ? `<div style="margin-top:6px;color:#2c7a2c;font-size:13px">✓ ${a}</div>` : ""}${!showAnswers && !hasBlank ? `<div class="line"></div><div class="line"></div>` : ""}</div>`;
}).join("")}`).join("")}
</body></html>`;
}

function buildQuizHtml(questions: import("@/lib/api").QuizQuestion[], topic: string, condition: string, showAnswers: boolean): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${showAnswers ? "Quiz Answers" : "Quiz"} — ${topic}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:750px;margin:40px auto;padding:0 24px;color:#333;line-height:1.7}
  h1{font-size:22px;border-bottom:2px solid #C27D6E;padding-bottom:8px}
  .q{background:#F7F3EC;border-radius:8px;padding:14px;margin:14px 0}
  .opt{padding:6px 10px;margin:4px 0;border-radius:6px;font-size:14px}
  .correct{background:#DCE8DB;font-weight:bold}
  .explain{font-size:13px;color:#5E7D5C;margin-top:6px;font-style:italic}
  .hint{font-size:12px;color:#888;margin-top:4px}
  @media print{body{margin:20px}}
</style></head><body>
<h1>${showAnswers ? "Answer Sheet" : "Quiz"} — ${topic} (${condition})</h1>
${questions.map((q,i) => `<div class="q">
  <p><strong>Q${i+1}.</strong> ${q.question}</p>
  ${q.options.map((opt,j) => `<div class="opt ${showAnswers && j===q.correct_index ? "correct" : ""}">${String.fromCharCode(65+j)}. ${opt}${showAnswers && j===q.correct_index ? " ✓" : ""}</div>`).join("")}
  ${showAnswers && q.explanation ? `<p class="explain">✓ ${q.explanation}</p>` : ""}
  ${!showAnswers && q.hint ? `<p class="hint">💡 ${q.hint}</p>` : ""}
</div>`).join("")}
</body></html>`;
}


const KIND_DIFFICULTY: Record<string, number> = {
  adhd_slides: 3, autism_slides: 3, transcribe: 2,
};

/* Pipeline step type */
type PipelineStep = "idle" | "uploading" | "reading" | "ready" | "generating" | "done" | "error";


/* Upload Zone */
function UploadZone({ onFile, disabled }: { onFile: (fileId: string, name: string) => void; disabled?: boolean }) {
  const ui = useUiStrings();
  const [dragging, setDragging]   = useState(false);
  const [uploaded, setUploaded]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const ref                       = useRef<HTMLInputElement>(null);

  async function accept(file: File) {
    setUploading(true); setError(null);
    try {
      const res = await api.uploadFile(file);
      setUploaded(file.name);
      onFile(res.file_id, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : ui.educator.uploadFailed);
    } finally { setUploading(false); }
  }

  return (
    <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) accept(f); }}
      id="ilm-educator-upload"
      onClick={() => !uploading && !disabled && ref.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all scroll-mt-24 ${dragging ? "border-terra bg-terra-lo" : "border-sand-mid hover:border-terra hover:bg-terra-lo"} ${uploading || disabled ? "opacity-60 cursor-wait" : "cursor-pointer"}`}>
      <input ref={ref} type="file" accept=".pdf,.mp3,.wav,.jpg,.jpeg,.png,.docx"
        onChange={e => { const f = e.target.files?.[0]; if (f) accept(f); }} className="hidden" />
      {uploading ? (
        <div className="space-y-2">
          <div className="w-10 h-10 border-2 border-terra border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-bark-soft text-sm">{ui.educator.uploadUploading}</p>
        </div>
      ) : uploaded ? (
        <div className="space-y-1.5">
          <div className="w-10 h-10 bg-terra-lo rounded-xl flex items-center justify-center mx-auto text-terra-hi text-lg">✓</div>
          <p className="font-semibold text-terra-hi text-sm">{uploaded}</p>
          <p className="text-bark-faint text-xs">{ui.educator.uploadReplace}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="w-12 h-12 bg-sand rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-bark-soft" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-bark-deep text-sm">{ui.educator.uploadDrop}</p>
            <p className="text-bark-faint text-xs mt-0.5">{ui.educator.uploadTypes}</p>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-terra-hi text-xs">{error}</p>}
    </div>
  );
}

/* Pocket card */
function PocketCard({ pocket }: { pocket: api.Pocket }) {
  const [expanded, setExpanded] = useState(false);
  const typeColors: Record<string, string> = {
    concept: "bg-sage-lo text-sage", fact: "bg-honey-lo text-bark-deep",
    process: "bg-dust-lo text-dust", example: "bg-terra-lo text-terra-hi",
  };
  const complexityDots = [1, 2, 3, 4, 5];

  return (
    <div className="bg-white rounded-2xl border border-sand-mid shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-sand/30 transition-colors">
        <div className="w-6 h-6 bg-terra-lo rounded-lg flex items-center justify-center text-terra-hi text-xs font-bold shrink-0 mt-0.5">{pocket.id}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-bark-deep text-sm">{pocket.concept}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColors[pocket.pocket_type] ?? "bg-sand text-bark"}`}>{pocket.pocket_type}</span>
          </div>
          <div className="flex gap-0.5 mt-1">
            {complexityDots.map(n => (
              <div key={n} className={`w-2 h-2 rounded-full ${n <= pocket.complexity ? "bg-terra" : "bg-sand-mid"}`} />
            ))}
          </div>
        </div>
        <span className="text-bark-faint text-sm shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-sand">
          <ul className="space-y-1 mt-3">
            {pocket.key_points.map((kp, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-bark-deep">
                <span className="text-terra mt-0.5 shrink-0">•</span>{kp}
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

/* Bionic Reading — bold first 1-3 */
function bionicN(len: number): number {
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  return Math.ceil(len * 0.4);
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

/* Canva-style rich slide colour themes (shared */
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

function FmtPicker({ fmt, setFmt, downloadUrl, accentColor }: {
  fmt: "pptx"|"pdf"|"png"; setFmt: (f:"pptx"|"pdf"|"png") => void;
  downloadUrl: string; accentColor: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex bg-sand rounded-xl p-0.5 gap-0.5">
        {(["pptx","pdf","png"] as const).map(f => (
          <button key={f} onClick={() => setFmt(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${fmt===f ? "bg-white shadow text-bark-deep" : "text-bark-faint hover:text-bark-deep"}`}>
            {f}
          </button>
        ))}
      </div>
      {fmt === "pptx"
        ? <a href={apiUrl(downloadUrl)} download
            className="flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: accentColor }}>
            ⬇ Download
          </a>
        : <span className="flex items-center gap-1.5 bg-sand text-bark-faint px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed border border-dashed border-sand-mid">
            ⬇ Coming soon
          </span>
      }
    </div>
  );
}

/* ADHD */
function ADHDSlidesPanel({ result }: { result: AgentSlidesResponse }) {
  const [fmt, setFmt] = useState<"pptx"|"pdf"|"png">("pptx");
  const slides = result.slides as ADHDSlide[];
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-bark-deep">Focus Slides · {result.slide_count} slides</h3>
          <p className="text-[10px] text-dust font-semibold mt-0.5">🧠 Bionic Reading · colour-coded · one big idea per slide</p>
        </div>
        <FmtPicker fmt={fmt} setFmt={setFmt} downloadUrl={result.download_url} accentColor="#8B6914" />
      </div>
      {slides.map((s, i) => {
        const t = CANVA[s.color_theme] ?? CANVA.teal;
        return (
          <div key={i} className="rounded-2xl overflow-hidden shadow-lg border border-sand-mid">
            <div className="relative overflow-hidden px-6 pt-5 pb-8" style={{ background: t.header, minHeight: 120 }}>
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full" style={{ background: t.bubble1 }} />
              <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full" style={{ background: t.bubble2 }} />
              <div className="absolute top-4 right-5 w-12 h-12 rounded-full" style={{ background: t.bubble1 }} />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background:"rgba(0,0,0,0.18)", color: t.headerText }}>
                  {String(s.index).padStart(2,"0")}
                </span>
                {s.timer_minutes && (
                  <span className="text-xs font-semibold" style={{ color:`${t.headerText}CC` }}>⏱ {s.timer_minutes} min</span>
                )}
              </div>
              <h4 className="text-xl font-black leading-tight relative z-10" style={{ color: t.headerText }}>
                <Bionic text={s.title} />
              </h4>
            </div>
            <div className="h-1.5" style={{ background:`linear-gradient(to right,${t.header}99,transparent)` }} />
            <div className="px-6 py-4 space-y-3" style={{ background: t.content }}>
              {(s.visual_hint || s.title) && (
                <SlideVisual visualHint={s.visual_hint} title={s.title} topic={result.topic} variant="banner" />
              )}
              {s.focus_question && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-2.5" style={{ background: t.qBg }}>
                  <span className="text-lg shrink-0">🎯</span>
                  <p className="text-sm font-bold" style={{ color: t.qText }}>{s.focus_question}</p>
                </div>
              )}
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Clear & Calm Slides result */
function AutismSlidesPanel({ result }: { result: AgentSlidesResponse }) {
  const [fmt, setFmt] = useState<"pptx"|"pdf"|"png">("pptx");
  const slides = result.slides as AutismSlide[];
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-bark-deep">Clear & Calm Slides · {result.slide_count} slides</h3>
          <p className="text-[10px] text-[#3F51B5] font-semibold mt-0.5">🧠 Bionic Reading · same layout every slide · plain language</p>
        </div>
        <FmtPicker fmt={fmt} setFmt={setFmt} downloadUrl={result.download_url} accentColor="#3F51B5" />
      </div>
      {slides.map((s, i) => (
        <div key={i} className="rounded-2xl overflow-hidden shadow-lg border border-[#C5CAE9]">
          <div className="relative overflow-hidden bg-[#1A237E] px-6 py-5">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/8" />
            <div className="flex gap-1 mb-3 relative z-10">
              {slides.map((_, di) => (
                <div key={di} className={`h-1.5 rounded-full flex-1 ${di === i ? "bg-[#90CAF9]" : "bg-white/20"}`} />
              ))}
            </div>
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm">{s.index}</span>
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Topic {s.index} of {slides.length}</p>
                <h4 className="text-white text-lg font-bold leading-snug"><Bionic text={s.heading} /></h4>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 space-y-3">
            {(s.visual_description || s.heading) && (
              <SlideVisual
                visualDescription={s.visual_description}
                title={s.heading}
                topic={result.topic}
                variant="banner"
              />
            )}
            <div className="flex items-start gap-3 bg-[#E8EAF6] rounded-xl px-4 py-3">
              <span className="text-[#1A237E] font-black text-[10px] uppercase tracking-wider shrink-0 mt-0.5 w-9">What</span>
              <p className="text-bark-deep text-sm leading-relaxed"><Bionic text={s.what} /></p>
            </div>
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
          </div>
        </div>
      ))}
    </div>
  );
}

/* Easy Read Slides result (Dyslexia) */
function DyslexiaSlidesPanel({ result }: { result: AgentSlidesResponse }) {
  const [fmt, setFmt] = useState<"pptx"|"pdf"|"png">("pptx");
  const slides = result.slides as DyslexiaSlide[];
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-bark-deep">Easy Read Slides · {result.slide_count} slides</h3>
          <p className="text-[10px] text-[#1A5C96] font-semibold mt-0.5">📖 Large print · generous spacing · key phrases highlighted</p>
        </div>
        <FmtPicker fmt={fmt} setFmt={setFmt} downloadUrl={result.download_url} accentColor="#1A5C96" />
      </div>
      {slides.map((s, i) => (
        <div key={i} className="rounded-2xl overflow-hidden shadow-lg border border-[#E8F4FD]">
          {/* Blue header band */}
          <div className="relative overflow-hidden bg-[#1A5C96] px-6 pt-5 pb-8" style={{ minHeight: 110 }}>
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute bottom-2 left-1/3 w-20 h-20 rounded-full bg-white/6" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-black/20 text-white">
                {String(s.index).padStart(2,"0")}
              </span>
            </div>
            <h4 className="text-white text-xl font-black leading-tight relative z-10">
              <Bionic text={s.title} />
            </h4>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-[#1A5C96] to-transparent" />
          {/* Content — extra generous spacing for readability */}
          <div className="bg-[#FAF8F5] px-6 py-5 space-y-4">
            {(s.visual_hint || s.title) && (
              <SlideVisual visualHint={s.visual_hint} title={s.title} topic={result.topic} variant="banner" />
            )}
            <ul className="space-y-3">
              {(s.bullets ?? []).map((b, j) => (
                <li key={j} className="flex items-start gap-3 text-base text-[#1C1C1C] leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-[#1A5C96] shrink-0 mt-2.5" />
                  <Bionic text={b} />
                </li>
              ))}
            </ul>
            {s.key_phrase && (
              <div className="bg-[#FFF080] rounded-xl px-4 py-3 inline-block">
                <p className="text-[10px] font-black text-[#1C1C1C] uppercase tracking-widest mb-1">Key phrase</p>
                <p className="font-black text-[#1C1C1C] text-lg">{s.key_phrase}</p>
              </div>
            )}
            {s.reading_note && (
              <div className="bg-[#E8F4FD] rounded-xl px-4 py-3 text-[#1A5C96] text-sm font-medium">
                📖 {s.reading_note}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Transcribe result */
function TranscribePanel({ result }: { result: TranscribeResponse }) {
  const { script, estimated_duration_minutes, word_count, audio_url } = result;
  const [activeSegment, setActive] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function downloadMp3() {
    if (!audio_url || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(apiUrl(audio_url), { headers: apiFetchHeaders() });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "ilmio-audiobook.mp3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download MP3. The server may have restarted — please regenerate.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-sage-lo shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 bg-sage-lo rounded-xl flex items-center justify-center text-xl">🎧</span>
          <div className="flex-1">
            <p className="font-bold text-bark-deep text-base">{script?.title ?? "Audio Script"}</p>
            <p className="text-bark-faint text-xs">~{estimated_duration_minutes?.toFixed(1)} min · {word_count} words</p>
          </div>
          {audio_url ? (
            <button onClick={downloadMp3} disabled={downloading}
              className="flex items-center gap-2 bg-sage text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity shrink-0 disabled:opacity-50">
              {downloading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Downloading…
                </span>
              ) : "⬇ MP3"}
            </button>
          ) : (
            <span className="text-xs text-bark-faint bg-sand px-3 py-1.5 rounded-xl">No audio — TTS unavailable</span>
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
                <span className="w-5 h-5 bg-sage text-white text-xs rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="font-semibold text-bark-deep text-sm flex-1">{seg.concept}</p>
                <span className="text-bark-faint text-sm">{activeSegment === i ? "▲" : "▼"}</span>
              </button>
              {activeSegment === i && (
                <div className="px-4 pb-4 pt-2 bg-white">
                  <p className="text-bark-deep text-sm leading-loose whitespace-pre-line">{seg.narrative}</p>
                  {seg.transition && (
                    <p className="text-sage text-xs mt-3 italic">{seg.transition}</p>
                  )}
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
        <div className="bg-sand rounded-xl p-4 max-h-72 overflow-y-auto">
          <p className="text-bark-deep text-sm leading-loose whitespace-pre-line">{result.full_text}</p>
        </div>
      </div>
    </div>
  );
}

/* Pipeline Step Indicator */
function PipelineIndicator({ step }: { step: PipelineStep }) {
  const ui = useUiStrings();
  const ps = ui.student.pipelineSteps;
  const steps = [
    { key: "uploading", label: ps.upload },
    { key: "reading", label: ps.read },
    { key: "ready", label: ps.select },
    { key: "generating", label: ps.generate },
    { key: "done", label: ps.done },
  ];
  const idx = steps.findIndex(s =>
    s.key === step || (step === "error" && s.key === "generating")
  );

  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
            i < idx ? "bg-sage text-white" :
            i === idx ? "bg-terra text-white" :
            "bg-sand text-bark-faint"
          }`}>
            {i < idx && <span>✓</span>}
            <span>{s.label}</span>
          </div>
          {i < steps.length - 1 && <span className={`text-xs ${i < idx ? "text-sage" : "text-sand-mid"}`} aria-hidden>›</span>}
        </div>
      ))}
    </div>
  );
}

/* Page */
export default function EducatorDashboard() {
  const [fileId, setFileId]             = useState<string | null>(null);
  const [fileName, setFileName]         = useState<string>("");
  const { lang } = useIlmLanguage();
  const ui = useUiStrings();
  const [step, setStep]                 = useState<PipelineStep>("idle");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [pockets, setPockets]           = useState<PocketsResponse | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Output state
  type OutputKind = "adhd" | "autism" | "dyslexia" | "transcribe";
  const [activeOutput, setActiveOutput]           = useState<OutputKind | null>(null);
  const [adhdResult, setAdhdResult]               = useState<AgentSlidesResponse | null>(null);
  const [autismResult, setAutismResult]           = useState<AgentSlidesResponse | null>(null);
  const [dyslexiaResult, setDyslexiaResult]       = useState<AgentSlidesResponse | null>(null);
  const [transcribeResult, setTranscribeResult]   = useState<TranscribeResponse | null>(null);
  const [genMessage, setGenMessage]               = useState(0);
  const [truncatedWarning, setTruncatedWarning]   = useState(false);

  const GEN_MESSAGES = ui.educator.genMessages;
  const EDUCATOR_OUTPUT_OPTIONS = getEducatorOutputOptions(lang);

  // Curious Critic
  type CriticKind = "worksheet" | "quiz";
  const [criticCondition, setCriticCondition]     = useState("general");
  const [worksheetResult, setWorksheetResult]     = useState<AgentWorksheetResponse | null>(null);
  const [quizResult, setQuizResult]               = useState<AgentQuizResponse | null>(null);
  const [activeCritic, setActiveCritic]           = useState<CriticKind | null>(null);
  const [criticGenerating, setCriticGenerating]   = useState(false);
  const [criticError, setCriticError]             = useState<string | null>(null);

  // Sidebar
  const [students, setStudents]         = useState<StudentProfile[]>([]);
  const [studentsSource, setStudentsSource] = useState<"api" | "demo">("demo");
  const [reports, setReports]           = useState<WeeklyReport[]>([]);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportError, setReportError]   = useState<string | null>(null);
  const [bars, setBars]                 = useState<{ label: string; value: number; color: string }[]>([]);
  const [expandedStudent, setExpanded]  = useState<string | null>(GENERAL_CLASS_ID);
  const [heatmapCells, setHeatmapCells] = useState<HeatmapCell[]>([]);
  const [sessionEvents, setSessionEvents] = useState<{ topic: string; difficulty: number }[]>([]);

  const generatedOutputs = useMemo(() => {
    const out: string[] = [];
    if (adhdResult) out.push("ADHD slides");
    if (autismResult) out.push("Autism slides");
    if (dyslexiaResult) out.push("Dyslexia slides");
    if (transcribeResult) out.push("Audio script");
    if (worksheetResult) out.push(`Worksheet (${criticCondition})`);
    if (quizResult) out.push(`Quiz (${criticCondition})`);
    return out;
  }, [adhdResult, autismResult, dyslexiaResult, transcribeResult, worksheetResult, quizResult, criticCondition]);

  const refreshAnalytics = useCallback(() => {
    api.getAnalyticsBars().then(setBars).catch(() => {});
    api.getHeatmap().then(r => setHeatmapCells(r.cells)).catch(() => {});
  }, []);

  const setSidebar = useCallback((open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem(EDUCATOR_SIDEBAR_KEY, open ? "open" : "closed");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(EDUCATOR_SIDEBAR_KEY) === "closed") setSidebarOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebar(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebar]);

  useEffect(() => {
    if (!sidebarOpen || typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    if (mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const onPageAction = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id === "open_class_panel") setSidebar(true);
      else if (id === "close_class_panel") setSidebar(false);
      else if (id === "scroll_educator_upload") {
        document.getElementById("ilm-educator-upload")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener(ILM_ASSISTANT_PAGE_EVENT, onPageAction);
    return () => window.removeEventListener(ILM_ASSISTANT_PAGE_EVENT, onPageAction);
  }, [setSidebar]);

  useEffect(() => {
    api.getStudents()
      .then((r) => {
        const list = r.students.length > 0 ? r.students : DEMO_CLASS_ROSTER;
        setStudents(list);
        setStudentsSource(r.students.length > 0 ? "api" : "demo");
        setExpanded((prev) => prev ?? GENERAL_CLASS_ID);
      })
      .catch(() => {
        setStudents(DEMO_CLASS_ROSTER);
        setStudentsSource("demo");
        setExpanded(GENERAL_CLASS_ID);
      });
    api.getReports().then(setReports).catch(() => setReports([]));
    refreshAnalytics();
  }, [refreshAnalytics]);

  const langMounted = useRef(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [observerResults, setObserverResults] = useState<StudentObserverResult[] | null>(null);
  const [observerLoading, setObserverLoading] = useState(false);
  const [observerError, setObserverError] = useState<string | null>(null);

  useEffect(() => {
    if (!langMounted.current) { langMounted.current = true; return; }
    if (!fileId || translating) return;
    const hasSlides = step === "done" && !!activeOutput;
    const hasWorksheet = !!worksheetResult;
    const hasQuiz = !!quizResult;
    if (!hasSlides && !hasWorksheet && !hasQuiz) return;
    setTranslating(true);
    setTranslateError(null);
    (async () => {
      try {
        const p = await api.agentRead(fileId, lang);
        setPockets(p);
        setTruncatedWarning(!!p.truncated);
        if (activeOutput === "adhd") {
          const r = await api.agentADHDSlides(fileId, lang); setAdhdResult(r);
        } else if (activeOutput === "autism") {
          const r = await api.agentAutismSlides(fileId, lang); setAutismResult(r);
        } else if (activeOutput === "dyslexia") {
          const r = await api.agentDyslexiaSlides(fileId, lang) as AgentSlidesResponse; setDyslexiaResult(r);
        } else if (activeOutput === "transcribe") {
          const r = await api.agentTranscribe(fileId, lang); setTranscribeResult(r);
        }
        if (hasWorksheet) {
          const r = await api.agentWorksheet(fileId, criticCondition, lang); setWorksheetResult(r);
        }
        if (hasQuiz) {
          const r = await api.agentQuiz(fileId, criticCondition, lang); setQuizResult(r);
        }
      } catch (e) {
        setTranslateError(e instanceof Error ? e.message : "Could not refresh in this language");
      } finally { setTranslating(false); }
    })();
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== "generating") return;
    setGenMessage(0);
    const id = setInterval(() => setGenMessage(m => (m + 1) % GEN_MESSAGES.length), 2000);
    return () => clearInterval(id);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1+2: Upload → auto-trigger Reader Agent
  async function handleUpload(id: string, name: string) {
    setFileId(id); setFileName(name);
    setPockets(null); setPipelineError(null);
    setAdhdResult(null); setAutismResult(null); setDyslexiaResult(null); setTranscribeResult(null);
    setTruncatedWarning(false);
    setActiveOutput(null); setStep("reading");
    setWorksheetResult(null); setQuizResult(null); setActiveCritic(null); setCriticError(null);
    try {
      const p = await api.agentRead(id, lang);
      setPockets(p);
      setTruncatedWarning(!!p.truncated);
      setStep("ready");
      trackEvent("upload", { topic: p.topic, filename: name }, isGeneralClassSelection(expandedStudent) ? GENERAL_CLASS_ID : (expandedStudent ?? DEMO_STUDENT_ID));
    } catch (e) {
      setPipelineError(e instanceof Error ? e.message : "Reader Agent failed");
      setStep("error");
    }
  }

  // Step 3: Teacher selects output type → Orchestrator dispatches to agent
  async function runStudentObserver() {
    setObserverLoading(true);
    setObserverError(null);
    try {
      const payload = students.map((s) => ({
        student_id: s.id,
        id: s.id,
        name: s.name,
        condition: s.condition,
        weekly_progress: s.weekly_progress,
        preferred_mode: s.learning_style,
      }));
      const events = sessionEvents.map((e) => ({
        event_type: "slide_view",
        topic: e.topic,
        difficulty: e.difficulty,
      }));
      const r = await api.agentStudentObserver(payload, events, pockets?.topic ?? "");
      setObserverResults(r.students);
    } catch (e) {
      setObserverError(e instanceof Error ? e.message : "Student Observer failed");
    } finally {
      setObserverLoading(false);
    }
  }

  async function generate(kind: OutputKind) {
    if (!fileId || step === "generating") return;
    setActiveOutput(kind);
    setStep("generating");
    const sid = trackingId;
    try {
      if (kind === "adhd") {
        const r = await api.agentADHDSlides(fileId, lang);
        setAdhdResult(r);
        const ev = { topic: "Focus Slides", difficulty: 3 };
        setSessionEvents(prev => [...prev, ev]);
        trackEvent("slide_view", ev, sid);
      } else if (kind === "autism") {
        const r = await api.agentAutismSlides(fileId, lang);
        setAutismResult(r);
        const ev = { topic: "Clear & Calm Slides", difficulty: 3 };
        setSessionEvents(prev => [...prev, ev]);
        trackEvent("slide_view", ev, sid);
      } else if (kind === "dyslexia") {
        const r = await api.agentDyslexiaSlides(fileId, lang) as AgentSlidesResponse;
        setDyslexiaResult(r);
        const ev = { topic: "Easy Read Slides", difficulty: 2 };
        setSessionEvents(prev => [...prev, ev]);
        trackEvent("slide_view", ev, sid);
      } else {
        const r = await api.agentTranscribe(fileId, lang);
        setTranscribeResult(r);
        const ev = { topic: "Audio Transcription", difficulty: 2 };
        setSessionEvents(prev => [...prev, ev]);
        trackEvent("slide_view", ev, sid);
      }
      setStep("done");
      refreshAnalytics();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setPipelineError(
        msg.toLowerCase().includes("fetch") || msg.includes("Failed to fetch")
          ? "Cannot reach server — start backend on port 8000 and check ILMU_API_KEY."
          : msg
      );
      setStep("error");
    }
  }

  async function generateCritic(kind: CriticKind) {
    if (!fileId || criticGenerating) return;
    setActiveCritic(kind);
    setCriticGenerating(true); setCriticError(null);
    setWorksheetResult(null); setQuizResult(null);
    try {
      const sid = trackingId;
      if (kind === "worksheet") {
        const r = await api.agentWorksheet(fileId, criticCondition, lang);
        setWorksheetResult(r);
        trackEvent("quiz_answer", { topic: "Worksheet", difficulty: 2 }, sid);
      } else {
        const r = await api.agentQuiz(fileId, criticCondition, lang);
        setQuizResult(r);
        trackEvent("quiz_answer", { topic: "Quiz", difficulty: 3 }, sid);
      }
      refreshAnalytics();
    } catch (e) {
      setCriticError(e instanceof Error ? e.message : "Curious Critic failed");
    } finally {
      setCriticGenerating(false);
    }
  }

  async function triggerReport() {
    setReportGenerating(true);
    setReportError(null);
    try {
      const r = await api.generateReport();
      setReports((prev) => [r, ...prev.filter((x) => x.id !== r.id)].slice(0, 5));
      trackEvent("slide_view", { topic: "Weekly report generated", difficulty: 2 }, trackingId);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : "Could not generate report");
    } finally {
      setReportGenerating(false);
    }
  }

  const isGeneralMode = isGeneralClassSelection(expandedStudent);
  const trackedStudent = isGeneralMode
    ? null
    : students.find((s) => s.id === expandedStudent) ?? null;
  const trackingId = isGeneralMode
    ? GENERAL_CLASS_ID
    : expandedStudent ?? DEMO_STUDENT_ID;

  const formatRec = useMemo(() => {
    const condition = trackedStudent?.condition ?? "Mixed";
    const rec = recommendedFormatForCondition(condition);
    if (!rec) return null;
    const copy = FORMAT_COPY[lang]?.[rec.kind] ?? FORMAT_COPY.en[rec.kind];
    const tips =
      EDUCATOR_FORMAT_TIPS[lang]?.[rec.kind] ??
      EDUCATOR_FORMAT_TIPS.en?.[rec.kind] ??
      rec.tips;
    return { ...rec, label: copy.label, shortLabel: copy.shortLabel, oneLine: copy.why, tips };
  }, [trackedStudent, lang]);
  const activeResult =
    activeOutput === "adhd"      ? adhdResult      :
    activeOutput === "autism"    ? autismResult    :
    activeOutput === "dyslexia"  ? dyslexiaResult  :
    transcribeResult;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <header className="bg-parch border-b border-sand-mid px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-1.5 text-bark-soft hover:text-bark-deep transition-colors text-xs font-semibold px-2.5 py-1.5 bg-sand rounded-xl hover:bg-sand-mid shrink-0">
            {ui.nav.home}
          </Link>
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <IlmLogo size="sm" variant="white-on-terra" />
            <span className="font-serif text-xl font-semibold text-bark-deep group-hover:text-terra-hi transition-colors hidden sm:inline">ilm.io</span>
            <span className="px-2 py-0.5 bg-terra-lo text-terra-hi text-xs rounded-full font-medium hidden sm:inline">{ui.educator.mode}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="w-40 hidden md:block">
            <IlmLanguageSelect id="ilm-lang-educator" />
          </div>
          <button
            type="button"
            onClick={() => setSidebar(!sidebarOpen)}
            aria-expanded={sidebarOpen}
            aria-controls="educator-class-panel"
            aria-label={sidebarOpen ? ui.shared.hideClass : ui.shared.openClass}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border-2 ${
              sidebarOpen
                ? "bg-terra-lo border-terra text-terra-hi"
                : "bg-sand border-transparent text-bark-deep hover:bg-sand-mid"
            }`}
          >
            <span className="text-base leading-none" aria-hidden>
              👥
            </span>
            <span className="hidden sm:inline">{sidebarOpen ? ui.shared.hideClass : ui.shared.myClass}</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div
        className={`fixed inset-0 z-30 bg-bark-deep/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebar(false)}
        aria-hidden={!sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 pb-24">
          <div className="md:hidden max-w-xs pb-1">
            <IlmLanguageSelect id="ilm-lang-educator-mobile" />
          </div>
          {isGeneralMode && formatRec && (
            <div
              className={`rounded-2xl px-4 py-3 flex items-center gap-3 border-2 ${formatRec.theme.border} ${formatRec.theme.bgLo}`}
            >
              <span className="text-2xl">👥</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-bark-deep flex items-center gap-2 flex-wrap">
                  {ui.shared.sidebar.generalClass}
                  <FormatBadge kind={formatRec.kind} />
                </p>
                <p className="text-xs text-bark-soft">
                  {ui.shared.tryPrefix} {formatRec.emoji} {formatRec.label} · {formatRec.oneLine}
                </p>
              </div>
              <button type="button" onClick={() => setSidebar(true)} className="text-[11px] text-terra-hi font-semibold shrink-0">
                {ui.shared.change}
              </button>
            </div>
          )}
          {trackedStudent && formatRec && (
            <div
              className={`rounded-2xl px-4 py-3 flex items-center gap-3 border-2 ${formatRec.theme.border} ${formatRec.theme.bgLo}`}
            >
              <span className="text-2xl">{trackedStudent.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-bark-deep flex items-center gap-2 flex-wrap">
                  {trackedStudent.name}
                  <FormatBadge kind={formatRec.kind} />
                </p>
                <p className="text-xs text-bark-soft">
                  {ui.shared.tryPrefix} {formatRec.emoji} {formatRec.label} · {formatRec.oneLine}
                </p>
              </div>
              <button type="button" onClick={() => setSidebar(true)} className="text-[11px] text-terra-hi font-semibold shrink-0">
                {ui.shared.change}
              </button>
            </div>
          )}

          {/* Pipeline progress */}
          {step !== "idle" && (
            <div className="bg-parch rounded-2xl border border-sand-mid px-4 py-3 flex flex-wrap items-center gap-3">
              <PipelineIndicator step={step} />
              {step === "reading" && <p className="text-bark-soft text-xs ml-auto animate-pulse">{ui.educator.readingFile}</p>}
              {step === "generating" && <p className="text-bark-soft text-xs ml-auto animate-pulse">{ui.shared.makingSlides}</p>}
              {step === "done" && <p className="text-sage text-xs ml-auto font-medium">✓ {ui.shared.complete} — {fileName}</p>}
              {step === "error" && <p className="text-terra-hi text-xs ml-auto">{pipelineError}</p>}
            </div>
          )}

          {/* Reading loader */}
          {step === "reading" && (
            <div className="bg-parch rounded-3xl p-8 border border-sand-mid flex flex-col items-center gap-3 animate-fade-up">
              <div className="w-14 h-14 rounded-full border-4 border-terra border-t-transparent animate-spin" />
              <p className="font-semibold text-bark-deep">{ui.educator.readerScanTitle}</p>
              <p className="text-bark-faint text-xs">{ui.educator.readerScanSub}</p>
            </div>
          )}

          <div className="bg-parch rounded-3xl p-5 border border-sand-mid">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-bark-deep">{ui.educator.uploadTitle}</h2>
            </div>
            <UploadZone onFile={handleUpload} disabled={step === "reading" || step === "generating"} />
          </div>

          {pockets && (
            <details className="bg-parch rounded-3xl border border-sand-mid group open:border-sage/40">
              <summary className="cursor-pointer list-none p-5 font-bold text-bark-deep flex items-center gap-2 [&::-webkit-details-marker]:hidden">
                <span className="text-sage">✓</span>
                {pockets.pockets.length} topics ready · {pockets.topic}
                <span className="ml-auto text-[10px] text-bark-faint font-normal">{ui.shared.showDetails}</span>
              </summary>
              <div className="px-5 pb-5 space-y-3 border-t border-sand-mid pt-3">
                <p className="text-sm text-bark-deep">{pockets.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {pockets.vocabulary.slice(0, 8).map((v, i) => (
                    <span key={i} className="text-[10px] bg-sand px-2 py-0.5 rounded-full text-bark-deep">
                      {v.term}
                    </span>
                  ))}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <SimplePocketList pockets={pockets.pockets} />
                </div>
              </div>
            </details>
          )}

          {pockets && (
            <div className="bg-parch rounded-3xl p-5 border border-sand-mid">
              <h2 className="font-bold text-bark-deep mb-3">{ui.educator.pickFormat}</h2>

              {formatRec && (
                <button
                  type="button"
                  onClick={() => generate(formatRec.kind)}
                  disabled={step === "generating"}
                  className={`w-full mb-4 rounded-2xl border-2 p-4 text-left hover:opacity-95 disabled:opacity-50 ${formatRec.theme.border} ${formatRec.theme.bgLo}`}
                >
                  <p className={`text-[10px] font-bold uppercase ${formatRec.theme.textHi}`}>
                    {isGeneralMode
                      ? ui.educator.bestForAll
                      : `${ui.educator.bestFor} ${trackedStudent!.name.split(" ")[0]}`}
                  </p>
                  <p className="text-lg font-bold text-bark-deep mt-1 flex items-center gap-2">
                    <span>{formatRec.emoji}</span>
                    {formatRec.shortLabel}
                    <FormatBadge kind={formatRec.kind} />
                  </p>
                  <p className="text-xs text-bark-soft">{formatRec.oneLine}</p>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                {EDUCATOR_OUTPUT_OPTIONS.map((opt) => {
                  const active = activeOutput === opt.kind && step !== "idle";
                  return (
                    <button
                      key={opt.kind}
                      type="button"
                      onClick={() => generate(opt.kind)}
                      disabled={step === "generating"}
                      className={`rounded-2xl p-4 text-left transition-all ${educatorOutputButtonClass(opt.kind, active)} ${
                        step === "generating" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-2xl">{opt.emoji}</span>
                        <FormatBadge kind={opt.kind} />
                      </div>
                      <p className="font-bold text-sm text-bark-deep mt-2">{opt.title}</p>
                      <p className="text-[11px] text-bark-faint line-clamp-2">{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {translateError && (
            <div className="bg-terra-lo border border-terra rounded-2xl px-4 py-3 text-sm text-terra-hi">
              {translateError}
            </div>
          )}

          {/* Truncation warning banner */}
          {truncatedWarning && (
            <div className="bg-[#FFF8E1] border border-[#FFB300] rounded-2xl px-4 py-3 flex items-start gap-3">
              <span className="text-[#FFB300] text-lg shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-bark-deep text-sm font-medium">{ui.educator.truncatedTitle}</p>
                <p className="text-bark-soft text-xs mt-0.5">{ui.educator.truncatedSub}</p>
              </div>
              <button onClick={() => setTruncatedWarning(false)} className="text-bark-faint text-xs hover:text-bark-deep shrink-0">✕</button>
            </div>
          )}

          {/* Step 4: Output panel */}
          {(step === "generating" || step === "done" || step === "error") && (
            <div className="relative bg-parch rounded-3xl p-6 border border-sand-mid">
              {translating && <TranslatingOverlay />}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-sage rounded-full" />
                <h2 className="font-bold text-bark-deep">4 · Your slides</h2>
              </div>

              {step === "generating" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-sand rounded-2xl">
                    <div className="w-6 h-6 border-2 border-terra border-t-transparent rounded-full animate-spin shrink-0" />
                    <div>
                      <p className="text-bark-deep text-sm font-medium transition-all">
                        {GEN_MESSAGES[genMessage]}
                      </p>
                      <p className="text-bark-faint text-xs">
                        {activeOutput && getFormatLabel(lang, activeOutput)}
                        {" · 20–40 seconds"}
                      </p>
                    </div>
                  </div>
                  {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl shimmer" />)}
                </div>
              )}

              {step === "error" && (
                <div className="bg-terra-lo rounded-2xl p-4">
                  <p className="text-terra-hi font-semibold text-sm mb-1">{ui.educator.couldNotFinish}</p>
                  <p className="text-bark-deep text-sm">{pipelineError}</p>
                  <button onClick={() => { setStep("ready"); setPipelineError(null); }}
                    className="mt-3 text-xs text-terra-hi font-medium hover:underline">{ui.educator.backToSelection}</button>
                </div>
              )}

              {step === "done" && activeOutput === "adhd"      && adhdResult      && <ADHDSlidesPanel result={adhdResult} />}
              {step === "done" && activeOutput === "autism"    && autismResult    && <AutismSlidesPanel result={autismResult} />}
              {step === "done" && activeOutput === "dyslexia"  && dyslexiaResult  && <DyslexiaSlidesPanel result={dyslexiaResult} />}
              {step === "done" && activeOutput === "transcribe" && transcribeResult && <TranscribePanel result={transcribeResult} />}
            </div>
          )}

          {pockets && (
            <div className="relative bg-parch rounded-3xl p-5 border border-sand-mid">
              {translating && (worksheetResult || quizResult) && <TranslatingOverlay />}
              <h2 className="font-bold text-bark-deep mb-3">Extra · Worksheet or quiz</h2>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <label className="text-[11px] font-semibold text-bark-soft shrink-0">Style:</label>
                <select value={criticCondition} onChange={e => setCriticCondition(e.target.value)}
                  className="bg-sand border border-sand-mid rounded-xl px-3 py-1.5 text-sm text-bark-deep focus:outline-none focus:ring-2 focus:ring-dust">
                  <option value="general">Standard</option>
                  <option value="adhd">Focus-first</option>
                  <option value="dyslexia">Easy Read</option>
                  <option value="autism">Clear Structure</option>
                </select>
                <button onClick={() => generateCritic("worksheet")} disabled={criticGenerating}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${criticGenerating && activeCritic === "worksheet" ? "bg-dust text-white opacity-60" : "bg-dust-lo text-dust border-2 border-dust hover:bg-dust hover:text-white"}`}>
                  {criticGenerating && activeCritic === "worksheet"
                    ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                    : "📝 Worksheet"}
                </button>
                <button onClick={() => generateCritic("quiz")} disabled={criticGenerating}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${criticGenerating && activeCritic === "quiz" ? "bg-terra text-white opacity-60" : "bg-terra-lo text-terra-hi border-2 border-terra hover:bg-terra hover:text-white"}`}>
                  {criticGenerating && activeCritic === "quiz"
                    ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                    : "🧩 Quiz"}
                </button>
              </div>

              {criticError && (
                <div className="bg-terra-lo rounded-xl p-3 mb-4">
                  <p className="text-terra-hi text-sm">{criticError}</p>
                </div>
              )}

              {/* Worksheet result */}
              {worksheetResult && activeCritic === "worksheet" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-bark-deep">{worksheetResult.worksheet.title}</h4>
                      <span className="text-[10px] bg-dust-lo text-dust px-2 py-0.5 rounded-full font-medium capitalize">{worksheetResult.condition}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => dlBlob(buildEducatorWorksheetHtml(worksheetResult.worksheet, worksheetResult.topic, false), `worksheet-${worksheetResult.topic}.html`)}
                        className="flex items-center gap-1.5 bg-dust-lo text-dust-hi border border-dust px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-dust hover:text-white transition-colors">
                        ⬇ Worksheet
                      </button>
                      <button onClick={() => dlBlob(buildEducatorWorksheetHtml(worksheetResult.worksheet, worksheetResult.topic, true), `answers-${worksheetResult.topic}.html`)}
                        className="flex items-center gap-1.5 bg-sage-lo text-sage-hi border border-sage px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-sage hover:text-white transition-colors">
                        ⬇ Answer Sheet
                      </button>
                    </div>
                  </div>
                  {worksheetResult.worksheet.sections.map((sec, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-sand-mid p-4">
                      <p className="font-semibold text-bark-deep text-sm mb-1">{sec.title}</p>
                      <p className="text-bark-faint text-xs mb-2">{sec.instructions}</p>
                      <ul className="space-y-1.5">
                        {(sec.items ?? []).map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-bark-deep">
                            <span className="text-bark-faint shrink-0 mt-0.5">{j + 1}.</span>
                            {typeof item === "string" ? item : item.question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {worksheetResult.worksheet.exercises?.map((ex, i) => (
                    <div key={i} className="bg-sand rounded-2xl p-4">
                      <p className="text-bark-deep text-sm font-medium mb-2">{ex.prompt}</p>
                      {Array.from({ length: ex.space_lines ?? 3 }).map((_, j) => (
                        <div key={j} className="border-b border-sand-mid my-3 h-5" />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Quiz result */}
              {quizResult && activeCritic === "quiz" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-bark-deep">Quiz · {quizResult.quiz.questions.length} questions</h4>
                      <span className="text-[10px] bg-terra-lo text-terra-hi px-2 py-0.5 rounded-full font-medium capitalize">{quizResult.condition}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => dlBlob(buildQuizHtml(quizResult.quiz.questions, quizResult.topic, quizResult.condition, false), `quiz-${quizResult.topic}.html`)}
                        className="flex items-center gap-1.5 bg-terra-lo text-terra-hi border border-terra px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-terra hover:text-white transition-colors">
                        ⬇ Quiz
                      </button>
                      <button onClick={() => dlBlob(buildQuizHtml(quizResult.quiz.questions, quizResult.topic, quizResult.condition, true), `quiz-answers-${quizResult.topic}.html`)}
                        className="flex items-center gap-1.5 bg-sage-lo text-sage-hi border border-sage px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-sage hover:text-white transition-colors">
                        ⬇ Answer Sheet
                      </button>
                    </div>
                  </div>
                  {quizResult.quiz.questions.map((q, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-sand-mid p-4">
                      <p className="font-semibold text-bark-deep text-sm mb-3">Q{i + 1}. {q.question}</p>
                      <ul className="space-y-2 mb-3">
                        {q.options.map((opt, j) => (
                          <li key={j} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${j === q.correct_index ? "bg-sage-lo text-bark-deep font-medium" : "text-bark-deep"}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${j === q.correct_index ? "bg-sage text-white" : "bg-sand text-bark-faint"}`}>
                              {String.fromCharCode(65 + j)}
                            </span>
                            {opt}
                          </li>
                        ))}
                      </ul>
                      {q.hint && <p className="text-bark-faint text-xs italic">💡 {q.hint}</p>}
                      {q.explanation && <p className="text-sage text-xs mt-1">✓ {q.explanation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

        <aside
          id="educator-class-panel"
          className={`educator-class-panel flex shrink-0 h-full bg-parch border-l border-sand-mid overflow-hidden
            fixed inset-y-0 right-0 z-40 shadow-2xl lg:static lg:shadow-none
            transition-[width,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
            ${
              sidebarOpen
                ? "w-[min(18rem,92vw)] translate-x-0"
                : "w-0 translate-x-full border-l-0 lg:translate-x-0 lg:w-12 lg:border-l"
            }`}
        >
          {/* Collapsed rail — desktop only */}
          <button
            type="button"
            onClick={() => setSidebar(true)}
            className={`hidden lg:flex flex-col items-center justify-center gap-2 w-12 h-full shrink-0 py-6 text-terra-hi hover:bg-terra-lo/50 transition-colors ${
              sidebarOpen ? "lg:hidden" : ""
            }`}
            aria-label={ui.shared.openClass}
            tabIndex={sidebarOpen ? -1 : 0}
          >
            <span className="text-lg" aria-hidden>
              👥
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-bark-faint [writing-mode:vertical-rl] rotate-180">
              {ui.shared.classTab}
            </span>
            {trackedStudent ? (
              <span className="text-xl mt-2" title={trackedStudent.name}>
                {trackedStudent.emoji}
              </span>
            ) : isGeneralMode ? (
              <span className="text-xl mt-2" title={ui.shared.sidebar.generalClass}>
                👥
              </span>
            ) : null}
          </button>

          <div
            className={`w-[min(18rem,92vw)] lg:w-72 h-full overflow-y-auto p-4 transition-opacity duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none lg:hidden"
            }`}
          >
            <EducatorSidebar
              students={students}
              selectedId={expandedStudent}
              onSelect={setExpanded}
              formatRec={formatRec}
              selectedStudent={trackedStudent ?? null}
              heatmapCells={heatmapCells}
              sessionTopics={sessionEvents}
              reports={reports}
              reportGenerating={reportGenerating}
              reportError={reportError}
              onGenerateReport={triggerReport}
              onClose={() => setSidebar(false)}
              observerResults={observerResults}
              observerLoading={observerLoading}
              observerError={observerError}
              onRunObserver={runStudentObserver}
            />
          </div>
        </aside>
      </div>

      <EducatorIlmChat
        fileId={fileId}
        fileName={fileName}
        pockets={pockets}
        generatedOutputs={generatedOutputs}
        lang={lang}
        appExtras={{
          hasFile: !!fileId,
          filename: fileName || undefined,
          classPanelOpen: sidebarOpen,
        }}
      />
    </div>
  );
}
