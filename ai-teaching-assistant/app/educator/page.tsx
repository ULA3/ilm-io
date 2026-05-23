"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type {
  StudentProfile, WeeklyReport,
  PocketsResponse, ADHDSlide, AutismSlide, DyslexiaSlide, TranscribeResponse,
  AgentSlidesResponse, Language, HeatmapCell,
  AgentWorksheetResponse, AgentQuizResponse, IlmuistResponse,
} from "@/lib/api";
import { TranslatingOverlay } from "@/app/components/TranslatingOverlay";
import { trackEvent, DEMO_STUDENT_ID } from "@/lib/track";

/* ── Constants ───────────────────────────────────────────── */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English",       flag: "🇬🇧" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "zh", label: "普通话",         flag: "🇨🇳" },
  { code: "ta", label: "தமிழ்",          flag: "🇮🇳" },
];

const KIND_DIFFICULTY: Record<string, number> = {
  adhd_slides: 3, autism_slides: 3, transcribe: 2,
};

/* ── Pipeline step type ─────────────────────────────────── */
type PipelineStep = "idle" | "uploading" | "reading" | "ready" | "generating" | "done" | "error";

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


/* ── Ilmuist — context-aware Manglish AI guide ───────────── */
function Ilmuist({ fileId }: { fileId: string | null }) {
  const [open, setOpen]               = useState(false);
  const [msgs, setMsgs]               = useState<{ from: string; text: string }[]>([
    { from: "bot", text: "Aiyooo, selamat datang lah! 👋 I'm ilmuist — your teaching kaki here. Got any questions about your students or the slides, just tanya je lah!" },
  ]);
  const [history, setHistory]         = useState<{ role: string; content: string }[]>([]);
  const [input, setInput]             = useState("");
  const [thinking, setThinking]       = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const chatTracked                   = useRef(false);

  useEffect(() => {
    if (open && !chatTracked.current) {
      chatTracked.current = true;
      trackEvent("chatbot_open", { topic: "ilmuist educator chat" });
    }
  }, [open]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || thinking) return;
    setInput("");
    const newHistory = [...history, { role: "user", content: msg }];
    setHistory(newHistory);
    setMsgs(m => [...m, { from: "user", text: msg }]);
    setThinking(true); setSuggestions([]);
    try {
      const res: IlmuistResponse = await api.agentIlmuist(msg, history, fileId ?? undefined);
      setMsgs(m => [...m, { from: "bot", text: res.message }]);
      setHistory(h => [...h, { role: "assistant", content: res.message }]);
      setSuggestions(res.suggestions ?? []);
    } catch {
      setMsgs(m => [...m, { from: "bot", text: "Alamak, something went wrong lah… Try again boleh?" }]);
    } finally {
      setThinking(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label="Ilmuist AI guide"
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 w-14 h-14 bg-terra rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-terra-hi transition-colors z-50">
        {open ? "✕" : "🦜"}
      </button>
      {open && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-7 sm:w-84 bg-parch rounded-2xl shadow-2xl border border-sand-mid flex flex-col z-50" style={{ height: 500, maxWidth: 340 }}>
          <div className="bg-terra rounded-t-2xl px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg">🦜</div>
            <div>
              <p className="text-white font-bold text-sm">ilmuist</p>
              <p className="text-white/70 text-xs">Context-aware • Manglish-fluent</p>
            </div>
            {fileId && <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">Doc loaded ✓</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.from === "user" ? "bg-terra text-white rounded-tr-sm" : "bg-sand text-bark-deep rounded-tl-sm"}`}><ChatText text={m.text} /></div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-sand rounded-2xl px-4 py-3 flex gap-1">
                  {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-terra rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {suggestions.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className="text-[11px] bg-terra-lo text-terra-hi px-3 py-1 rounded-full hover:bg-terra-mid transition-colors font-medium">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="p-3 border-t border-sand-mid flex gap-2 shrink-0">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Tanya anything lah…"
              className="flex-1 bg-sand rounded-xl px-3 py-2 text-sm text-bark-deep placeholder-bark-faint focus:outline-none focus:ring-2 focus:ring-terra" />
            <button onClick={() => send()} className="w-9 h-9 bg-terra rounded-xl flex items-center justify-center text-white hover:bg-terra-hi transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Upload Zone ─────────────────────────────────────────── */
function UploadZone({ onFile, disabled }: { onFile: (fileId: string, name: string) => void; disabled?: boolean }) {
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
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  }

  return (
    <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) accept(f); }}
      onClick={() => !uploading && !disabled && ref.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${dragging ? "border-terra bg-terra-lo" : "border-sand-mid hover:border-terra hover:bg-terra-lo"} ${uploading || disabled ? "opacity-60 cursor-wait" : "cursor-pointer"}`}>
      <input ref={ref} type="file" accept=".pdf,.mp3,.wav,.jpg,.jpeg,.png,.docx"
        onChange={e => { const f = e.target.files?.[0]; if (f) accept(f); }} className="hidden" />
      {uploading ? (
        <div className="space-y-2">
          <div className="w-10 h-10 border-2 border-terra border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-bark-soft text-sm">Uploading…</p>
        </div>
      ) : uploaded ? (
        <div className="space-y-1.5">
          <div className="w-10 h-10 bg-terra-lo rounded-xl flex items-center justify-center mx-auto text-terra-hi text-lg">✓</div>
          <p className="font-semibold text-terra-hi text-sm">{uploaded}</p>
          <p className="text-bark-faint text-xs">Click to replace</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="w-12 h-12 bg-sand rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-bark-soft" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-bark-deep text-sm">Drop class material here</p>
            <p className="text-bark-faint text-xs mt-0.5">PDF · DOCX · MP3 · WAV · JPG · PNG</p>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-terra-hi text-xs">{error}</p>}
    </div>
  );
}

/* ── Pocket card ─────────────────────────────────────────── */
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

/* ── Bionic Reading — bold first 1-3 chars per word as fixation anchors ── */
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

/* ── Canva-style rich slide colour themes (shared by all panels) ── */
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
        ? <a href={`${BASE}${downloadUrl}`} download
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

/* ── ADHD / Focus Slides result ──────────────────────────── */
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

/* ── Clear & Calm Slides result ──────────────────────────── */
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
            {s.visual_description && (
              <div className="bg-[#F5F5F5] rounded-xl px-3 py-2 text-xs text-bark-faint italic">[ Visual ] {s.visual_description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Easy Read Slides result (Dyslexia) ──────────────────── */
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
            {s.visual_hint && (
              <div className="text-[#707070] text-sm italic">[ Image ] {s.visual_hint}</div>
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

/* ── Transcribe result ───────────────────────────────────── */
function TranscribePanel({ result }: { result: TranscribeResponse }) {
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

/* ── Pipeline Step Indicator ─────────────────────────────── */
function PipelineIndicator({ step }: { step: PipelineStep }) {
  const steps = [
    { key: "uploading", label: "Upload" },
    { key: "reading",   label: "Read" },
    { key: "ready",     label: "Select" },
    { key: "generating", label: "Generate" },
    { key: "done",      label: "Done" },
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
          {i < steps.length - 1 && <span className={`text-xs ${i < idx ? "text-sage" : "text-sand-mid"}`}>›</span>}
        </div>
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function EducatorDashboard() {
  const [fileId, setFileId]             = useState<string | null>(null);
  const [fileName, setFileName]         = useState<string>("");
  const [lang, setLang]                 = useState<Language>("en");
  const [step, setStep]                 = useState<PipelineStep>("idle");
  const [sidebarOpen, setSidebarOpen]   = useState(false);
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

  const GEN_MESSAGES = [
    "Reading your document…",
    "Adapting for your learning style…",
    "Almost ready…",
  ];

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
  const [reports, setReports]           = useState<WeeklyReport[]>([]);
  const [bars, setBars]                 = useState<{ label: string; value: number; color: string }[]>([]);
  const [expandedStudent, setExpanded]  = useState<string | null>(null);
  const [heatmapCells, setHeatmapCells] = useState<HeatmapCell[]>([]);
  const [sessionEvents, setSessionEvents] = useState<{ topic: string; difficulty: number }[]>([]);

  const refreshAnalytics = useCallback(() => {
    api.getAnalyticsBars().then(setBars).catch(() => {});
    api.getHeatmap().then(r => setHeatmapCells(r.cells)).catch(() => {});
  }, []);

  useEffect(() => {
    api.getStudents().then(r => setStudents(r.students)).catch(() => {});
    api.getReports().then(setReports).catch(() => {});
    refreshAnalytics();
  }, [refreshAnalytics]);

  const langMounted = useRef(false);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!langMounted.current) { langMounted.current = true; return; }
    if (!fileId || translating) return;
    const hasSlides = step === "done" && !!activeOutput;
    const hasWorksheet = !!worksheetResult;
    const hasQuiz = !!quizResult;
    if (!hasSlides && !hasWorksheet && !hasQuiz) return;
    setTranslating(true);
    (async () => {
      try {
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
      } catch { /* keep existing output on failure */ }
      finally { setTranslating(false); }
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
      setStep("ready");
      trackEvent("upload", { topic: p.topic, filename: name }, expandedStudent ?? DEMO_STUDENT_ID);
    } catch (e) {
      setPipelineError(e instanceof Error ? e.message : "Reader Agent failed");
      setStep("error");
    }
  }

  // Step 3: Teacher selects output type → Orchestrator dispatches to agent
  async function generate(kind: OutputKind) {
    if (!fileId || step === "generating") return;
    setActiveOutput(kind);
    setStep("generating");
    const sid = expandedStudent ?? DEMO_STUDENT_ID;
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
      setPipelineError(e instanceof Error ? e.message : "Agent generation failed");
      setStep("error");
    }
  }

  async function generateCritic(kind: CriticKind) {
    if (!fileId || criticGenerating) return;
    setActiveCritic(kind);
    setCriticGenerating(true); setCriticError(null);
    setWorksheetResult(null); setQuizResult(null);
    try {
      const sid = expandedStudent ?? DEMO_STUDENT_ID;
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
    try {
      const r = await api.generateReport();
      setReports(prev => [r, ...prev].slice(0, 5));
      trackEvent("slide_view", { topic: "Weekly report generated", difficulty: 2 });
    }
    catch { /* ignore */ }
  }

  const activeResult =
    activeOutput === "adhd"      ? adhdResult      :
    activeOutput === "autism"    ? autismResult    :
    activeOutput === "dyslexia"  ? dyslexiaResult  :
    transcribeResult;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="bg-parch border-b border-sand-mid px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-1.5 text-bark-soft hover:text-bark-deep transition-colors text-xs font-semibold px-2.5 py-1.5 bg-sand rounded-xl hover:bg-sand-mid shrink-0">
            ← Home
          </Link>
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 bg-terra rounded-xl flex items-center justify-center">
              <span className="text-white text-sm">✦</span>
            </div>
            <span className="font-serif text-xl font-semibold text-bark-deep group-hover:text-terra-hi transition-colors hidden sm:inline">ilm.io</span>
            <span className="px-2 py-0.5 bg-terra-lo text-terra-hi text-xs rounded-full font-medium hidden sm:inline">Educator</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Language selector */}
          <div className="flex items-center gap-0.5 bg-sand rounded-xl p-1">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${lang === l.code ? "bg-white shadow-sm text-bark-deep" : "text-bark-faint hover:text-bark-deep"}`}>
                <span>{l.flag}</span>
                <span className="hidden lg:inline">{l.label}</span>
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right hidden md:block">
              <p className="font-semibold text-bark-deep text-sm">Ms. Priya Nair</p>
              <p className="text-bark-faint text-xs">Grade 6 · Room 204</p>
            </div>
            <div className="w-9 h-9 bg-terra-mid rounded-full flex items-center justify-center text-lg">👩‍🏫</div>
          </div>
          {/* Sidebar toggle — mobile/tablet only */}
          <button onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle insights panel"
            className="lg:hidden w-9 h-9 bg-sand rounded-xl flex items-center justify-center text-bark-deep hover:bg-sand-mid transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────── */}
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-bark-deep/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* ── Main ───────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 pb-24">

          {/* Pipeline progress */}
          {step !== "idle" && (
            <div className="bg-parch rounded-2xl border border-sand-mid px-4 py-3 flex flex-wrap items-center gap-3">
              <PipelineIndicator step={step} />
              {step === "reading" && <p className="text-bark-soft text-xs ml-auto animate-pulse">Reader Agent analysing document…</p>}
              {step === "generating" && <p className="text-bark-soft text-xs ml-auto animate-pulse">Agent generating output…</p>}
              {step === "done" && <p className="text-sage text-xs ml-auto font-medium">✓ Complete — {fileName}</p>}
              {step === "error" && <p className="text-terra-hi text-xs ml-auto">{pipelineError}</p>}
            </div>
          )}

          {/* Reading loader */}
          {step === "reading" && (
            <div className="bg-parch rounded-3xl p-8 border border-sand-mid flex flex-col items-center gap-4 animate-fade-up">
              <div className="relative w-16 h-16 shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-terra-lo" />
                <div className="absolute inset-0 rounded-full border-4 border-terra border-t-transparent animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl">📖</span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-bark-deep mb-1">Reader Agent is scanning your material…</p>
                <p className="text-bark-faint text-sm leading-relaxed">Extracting concept pockets for all your agents. About 15–30 seconds.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {["Parsing document","Identifying concepts","Building pockets","Indexing vocab"].map((label, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-terra-lo rounded-full">
                    <span className="w-1.5 h-1.5 bg-terra rounded-full animate-pulse-dot" style={{ animationDelay: `${i*220}ms` }} />
                    <span className="text-terra-hi text-[10px] font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Upload + Language */}
          <div className="bg-parch rounded-3xl p-6 border border-sand-mid">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-bark-deep">📤 Step 1 — Upload class material</h2>
              <span className="text-xs text-bark-faint bg-sand px-2 py-1 rounded-full">Language: {LANGUAGES.find(l => l.code === lang)?.flag} {LANGUAGES.find(l => l.code === lang)?.label}</span>
            </div>
            <UploadZone onFile={handleUpload} disabled={step === "reading" || step === "generating"} />
          </div>

          {/* Step 2: Pockets preview (Orchestrator holds this) */}
          {pockets && (
            <div className="bg-parch rounded-3xl p-6 border border-sand-mid">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-sage rounded-full" />
                <h2 className="font-semibold text-bark-deep">Step 2 — Reader Agent: Knowledge Pockets</h2>
              </div>
              <p className="text-bark-faint text-xs mb-4 pl-4">Orchestrator extracted {pockets.pockets.length} concepts from <span className="font-medium text-bark-deep">{pockets.topic}</span></p>

              {/* Summary */}
              <div className="bg-sand rounded-2xl p-4 mb-4">
                <p className="text-bark-soft text-xs font-semibold uppercase tracking-wide mb-1">Summary</p>
                <p className="text-bark-deep text-sm leading-relaxed">{pockets.summary}</p>
              </div>

              {/* Objectives */}
              {pockets.learning_objectives.length > 0 && (
                <div className="mb-4">
                  <p className="text-bark-faint text-xs font-semibold uppercase tracking-wide mb-2">Learning objectives</p>
                  <ul className="space-y-1">
                    {pockets.learning_objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-bark-deep">
                        <span className="text-terra shrink-0 mt-0.5">✓</span>{obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vocabulary chips */}
              {pockets.vocabulary.length > 0 && (
                <div className="mb-4">
                  <p className="text-bark-faint text-xs font-semibold uppercase tracking-wide mb-2">Key vocabulary</p>
                  <div className="flex flex-wrap gap-2">
                    {pockets.vocabulary.map((v, i) => (
                      <span key={i} title={v.definition}
                        className="bg-white border border-sand-mid text-bark-deep text-xs px-2.5 py-1 rounded-full cursor-default hover:bg-sand transition-colors">
                        {v.term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pocket cards */}
              <p className="text-bark-faint text-xs font-semibold uppercase tracking-wide mb-2">Concept pockets</p>
              <div className="space-y-2">
                {pockets.pockets.map(p => <PocketCard key={p.id} pocket={p} />)}
              </div>
            </div>
          )}

          {/* Step 3: Output selection (shown once pockets are ready) */}
          {pockets && (
            <div className="bg-parch rounded-3xl p-6 border border-sand-mid">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-terra rounded-full" />
                <h2 className="font-semibold text-bark-deep">Step 3 — Select Output Format</h2>
              </div>
              <p className="text-bark-faint text-xs mb-5">Orchestrator is ready. Choose which agent should generate your output:</p>

              <div className="grid grid-cols-2 gap-4">
                {/* ADHD Slides */}
                <button onClick={() => generate("adhd")}
                  disabled={step === "generating"}
                  className={`rounded-3xl p-5 text-left border-2 transition-all ${
                    activeOutput === "adhd" && step !== "idle"
                      ? "border-dust bg-dust-lo"
                      : "border-dust-lo bg-white hover:border-dust hover:bg-dust-lo"
                  } ${step === "generating" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                  <div className="w-10 h-10 bg-dust rounded-xl flex items-center justify-center text-xl mb-3">🧩</div>
                  <p className="font-bold text-bark-deep text-sm mb-1">Focus Slides</p>
                  <p className="text-bark-faint text-xs leading-relaxed">One idea per slide · colour-coded sections · focus hooks · timer badges</p>
                  <span className="inline-block mt-3 text-[10px] bg-dust-lo text-dust px-2 py-0.5 rounded-full font-medium">Focus-first format</span>
                </button>

                {/* Autism Slides */}
                <button onClick={() => generate("autism")}
                  disabled={step === "generating"}
                  className={`rounded-3xl p-5 text-left border-2 transition-all ${
                    activeOutput === "autism" && step !== "idle"
                      ? "border-honey bg-honey-lo"
                      : "border-honey-lo bg-white hover:border-honey hover:bg-honey-lo"
                  } ${step === "generating" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                  <div className="w-10 h-10 bg-honey rounded-xl flex items-center justify-center text-xl mb-3">🗂️</div>
                  <p className="font-bold text-bark-deep text-sm mb-1">Clear & Calm Slides</p>
                  <p className="text-bark-faint text-xs leading-relaxed">Same layout on every slide · plain language · step-by-step · no surprises</p>
                  <span className="inline-block mt-3 text-[10px] bg-honey-lo text-bark-deep px-2 py-0.5 rounded-full font-medium">Predictable format</span>
                </button>

                {/* Dyslexia Slides */}
                <button onClick={() => generate("dyslexia")}
                  disabled={step === "generating"}
                  className={`rounded-3xl p-5 text-left border-2 transition-all ${
                    activeOutput === "dyslexia" && step !== "idle"
                      ? "border-[#1A5C96] bg-[#E8F4FD]"
                      : "border-[#E8F4FD] bg-white hover:border-[#1A5C96] hover:bg-[#E8F4FD]"
                  } ${step === "generating" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                  <div className="w-10 h-10 bg-[#1A5C96] rounded-xl flex items-center justify-center text-xl mb-3">📖</div>
                  <p className="font-bold text-bark-deep text-sm mb-1">Easy Read Slides</p>
                  <p className="text-bark-faint text-xs leading-relaxed">Clean font · soft background · highlighted key phrases · generous spacing</p>
                  <span className="inline-block mt-3 text-[10px] bg-[#E8F4FD] text-[#1A5C96] px-2 py-0.5 rounded-full font-medium">Reading-friendly format</span>
                </button>

                {/* Audio Transcription */}
                <button onClick={() => generate("transcribe")}
                  disabled={step === "generating"}
                  className={`rounded-3xl p-5 text-left border-2 transition-all ${
                    activeOutput === "transcribe" && step !== "idle"
                      ? "border-sage bg-sage-lo"
                      : "border-sage-lo bg-white hover:border-sage hover:bg-sage-lo"
                  } ${step === "generating" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                  <div className="w-10 h-10 bg-sage rounded-xl flex items-center justify-center text-xl mb-3">🎧</div>
                  <p className="font-bold text-bark-deep text-sm mb-1">Audio Version + MP3</p>
                  <p className="text-bark-faint text-xs leading-relaxed">Story-driven narrative script rendered to MP3 via TTS — download ready</p>
                  <span className="inline-block mt-3 text-[10px] bg-sage-lo text-sage px-2 py-0.5 rounded-full font-medium">Transcriber</span>
                </button>

              </div>
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

          {/* Step 4: Output panel */}
          {(step === "generating" || step === "done" || step === "error") && (
            <div className="relative bg-parch rounded-3xl p-6 border border-sand-mid">
              {translating && <TranslatingOverlay />}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-sage rounded-full" />
                <h2 className="font-semibold text-bark-deep">Step 4 — Agent Output</h2>
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
                        {activeOutput === "adhd"       && "Focus Slides"}
                        {activeOutput === "autism"     && "Clear & Calm Slides"}
                        {activeOutput === "dyslexia"   && "Easy Read Slides"}
                        {activeOutput === "transcribe" && "Transcriber"}
                        {" · 20–40 seconds"}
                      </p>
                    </div>
                  </div>
                  {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl shimmer" />)}
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

              {step === "done" && activeOutput === "adhd"      && adhdResult      && <ADHDSlidesPanel result={adhdResult} />}
              {step === "done" && activeOutput === "autism"    && autismResult    && <AutismSlidesPanel result={autismResult} />}
              {step === "done" && activeOutput === "dyslexia"  && dyslexiaResult  && <DyslexiaSlidesPanel result={dyslexiaResult} />}
              {step === "done" && activeOutput === "transcribe" && transcribeResult && <TranscribePanel result={transcribeResult} />}
            </div>
          )}

          {/* Curious Critic — worksheets & quizzes */}
          {pockets && (
            <div className="relative bg-parch rounded-3xl p-6 border border-sand-mid">
              {translating && (worksheetResult || quizResult) && <TranslatingOverlay />}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-dust rounded-full" />
                <h2 className="font-semibold text-bark-deep">Curious Critic — Worksheets & Quizzes</h2>
              </div>
              <p className="text-bark-faint text-xs mb-5 pl-4">Generate condition-tailored activities from the same document pockets.</p>

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <label className="text-xs font-semibold text-bark-soft shrink-0">Learning style:</label>
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

        {/* ── Right sidebar ───────────────────────────────── */}
        <aside className={`fixed lg:static inset-y-0 right-0 z-40 w-80 bg-parch border-l border-sand-mid overflow-y-auto p-5 shrink-0 space-y-5 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          {/* Mobile close row */}
          <div className="lg:hidden flex items-center justify-between mb-1 pb-3 border-b border-sand-mid">
            <p className="font-semibold text-bark-deep text-sm">Insights Panel</p>
            <button onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-bark-soft hover:text-bark-deep hover:bg-sand transition-colors">✕</button>
          </div>

          {/* Student profiles — Student Observer */}
          <div>
            <p className="text-xs font-semibold text-bark-faint uppercase tracking-wider mb-3">Student Profiles · Observer</p>
            <div className="space-y-2.5">
              {(students.length > 0 ? students : [
                { id: "1", name: "Alex Chen",   emoji: "🦋", condition: "ADHD",            learning_style: "Visual",      streak_days: 7,  weekly_progress: 70, insights: [], attention_trend: [], last_active: "" },
                { id: "2", name: "Sam Rivera",  emoji: "🌻", condition: "Dyslexia",         learning_style: "Auditory",    streak_days: 3,  weekly_progress: 50, insights: [], attention_trend: [], last_active: "" },
                { id: "3", name: "Jordan Park", emoji: "🦉", condition: "Autism Spectrum",  learning_style: "Structured",  streak_days: 12, weekly_progress: 85, insights: [], attention_trend: [], last_active: "" },
                { id: "4", name: "Maya Osei",   emoji: "🌿", condition: "ADHD",             learning_style: "Kinesthetic", streak_days: 5,  weekly_progress: 60, insights: [], attention_trend: [], last_active: "" },
              ] as StudentProfile[]).map(s => {
                const needsAttention = s.weekly_progress < 55;
                const conditionColors: Record<string, string> = {
                  "ADHD": "bg-dust-lo text-dust",
                  "Dyslexia": "bg-[#E8F4FD] text-[#1A5C96]",
                  "Autism Spectrum": "bg-honey-lo text-bark-deep",
                  "General": "bg-sand text-bark-soft",
                };
                const conditionKey = Object.keys(conditionColors).find(k => s.condition.includes(k)) ?? "General";
                return (
                  <div key={s.id}>
                    <button onClick={() => setExpanded(expandedStudent === s.id ? null : s.id)}
                      className="w-full flex items-start gap-3 p-3 bg-sand rounded-2xl hover:bg-sand-mid transition-colors text-left">
                      <span className="text-xl mt-0.5">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-bark-deep text-sm">{s.name}</p>
                          {needsAttention && <span className="text-[10px] bg-terra-lo text-terra-hi px-1.5 py-0.5 rounded-full font-bold">⚠ Needs attention</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${conditionColors[conditionKey]}`}>{s.condition}</span>
                          <span className="text-[10px] bg-parch text-bark-soft px-2 py-0.5 rounded-full">{s.learning_style}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-sand-mid rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${needsAttention ? "bg-terra" : "bg-sage"}`} style={{ width: `${s.weekly_progress}%` }} />
                          </div>
                          <p className="text-bark-faint text-[10px] shrink-0">{s.weekly_progress}% covered</p>
                        </div>
                      </div>
                      <span className="text-bark-faint text-xs shrink-0 mt-0.5">{expandedStudent === s.id ? "▲" : "▼"}</span>
                    </button>
                    {expandedStudent === s.id && (
                      <div className="mt-1 ml-3 p-3 bg-dust-lo rounded-xl space-y-1.5">
                        <p className="text-bark-faint text-[10px] uppercase tracking-wide font-semibold mb-1">AI Insights</p>
                        {s.insights.length > 0 ? s.insights.map((ins, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs">{ins.trend === "up" ? "📈" : ins.trend === "down" ? "📉" : "•"}</span>
                            <span className="text-bark-deep text-xs"><strong>{ins.label}:</strong> {ins.value}</span>
                          </div>
                        )) : (
                          <p className="text-bark-faint text-xs">No insights yet — generate content to track progress.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <p className="text-xs font-semibold text-bark-faint uppercase tracking-wider mb-3">Real-time AI Suggestions</p>
            <div className="space-y-2">
              {[
                { icon: "⚡", tip: "Alex's focus drops after 18 min — use the timer badges." },
                { icon: "🎵", tip: "Sam processes audio 40% faster — try the Audio Version." },
                { icon: "📅", tip: "Jordan needs predictable structure — use Restructured Slides." },
                { icon: "🎯", tip: "Maya improves with chunked content — use ADHD Slides." },
              ].map((t, i) => (
                <div key={i} className="bg-terra-lo rounded-xl p-3 flex items-start gap-2">
                  <span className="text-base shrink-0">{t.icon}</span>
                  <p className="text-bark-deep text-xs leading-relaxed">{t.tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Difficulty Heatmap */}
          <div>
            <p className="text-xs font-semibold text-bark-faint uppercase tracking-wider mb-3">Topic Difficulty Heatmap</p>
            {(() => {
              const heatColors = ["bg-sage-lo", "bg-sage-mid", "bg-honey-lo", "bg-terra-mid", "bg-terra"];
              const topicMap = new Map<string, number[]>();
              for (const cell of heatmapCells) {
                const arr = topicMap.get(cell.topic) ?? []; arr.push(cell.difficulty); topicMap.set(cell.topic, arr);
              }
              for (const ev of sessionEvents) {
                const arr = topicMap.get(ev.topic) ?? []; arr.push(ev.difficulty); topicMap.set(ev.topic, arr);
              }
              const topics: [string, number[]][] = topicMap.size > 0
                ? Array.from(topicMap.entries())
                : [["ADHD Slides", [3]], ["Autism Slides", [3]], ["Audio Version", [2]]];
              return (
                <div className="space-y-2">
                  {topics.map(([topic, vals]) => {
                    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                    const idx = Math.max(0, Math.min(4, Math.round(avg) - 1));
                    return (
                      <div key={topic} className="flex items-center gap-2">
                        <span className="text-bark-soft text-xs w-28 truncate shrink-0">{topic}</span>
                        <div className="flex-1 h-4 bg-sand-mid rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${heatColors[idx]}`} style={{ width: `${Math.round((avg / 5) * 100)}%` }} />
                        </div>
                        <span className="text-bark-faint text-xs w-4 shrink-0">{Math.round(avg)}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-bark-faint text-xs">Easy</span>
                    <div className="flex gap-1 flex-1">{heatColors.map(c => <div key={c} className={`flex-1 h-2 rounded ${c}`} />)}</div>
                    <span className="text-bark-faint text-xs">Hard</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Engagement bars */}
          {bars.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-bark-faint uppercase tracking-wider mb-3">Engagement Analytics</p>
              <div className="space-y-2.5">
                {bars.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs text-bark-faint mb-1"><span>{b.label}</span><span>{b.value}%</span></div>
                    <div className="h-2 bg-sand-mid rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly reports */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-bark-faint uppercase tracking-wider">Weekly Reports</p>
              <button onClick={triggerReport} className="text-xs text-terra-hi font-medium hover:underline">Generate</button>
            </div>
            <div className="space-y-2">
              {(reports.length > 0 ? reports : [
                { id: "r1", week_label: "Week 20 · May 2026", summary: "Strong engagement across all cohorts.", highlights: [], recommendations: [], download_url: "", generated_at: "" },
                { id: "r2", week_label: "Week 19 · May 2026", summary: "Quiz completion improved by 12%.",     highlights: [], recommendations: [], download_url: "", generated_at: "" },
              ] as WeeklyReport[]).map(r => (
                <div key={r.id} className="bg-sand rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-bark-deep text-xs font-semibold truncate">{r.week_label}</p>
                    <p className="text-bark-faint text-xs line-clamp-2 mt-0.5">{r.summary}</p>
                  </div>
                  <span className="shrink-0 text-bark-faint text-[10px]">AI summary</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>

      <Ilmuist fileId={fileId} />
    </div>
  );
}
