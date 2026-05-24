"use client";

import { useState, useRef, useEffect } from "react";
import * as api from "@/lib/api";
import type {
  Language,
  PocketsResponse,
  StudentChatActionResponse,
} from "@/lib/api";
import { getAccSettings, speakIlmReply } from "@/lib/accessibility";
import { trackEvent } from "@/lib/track";
import { useUiStrings } from "@/lib/use-ui-strings";
import { buildAppContextSnapshot, type AppContextExtras, type AssistantPage } from "@/lib/app-context";

type ChatItem =
  | { from: "user"; text: string }
  | { from: "bot"; text: string }
  | { from: "bot"; action: StudentChatActionResponse };

const ACTION_META: {
  id: "summarize" | "quiz" | "vocab" | "study_plan" | "focus_tip";
  emoji: string;
  desc: string;
}[] = [
  { id: "summarize", emoji: "📋", desc: "5-bullet recap" },
  { id: "quiz", emoji: "❓", desc: "3 quick questions" },
  { id: "vocab", emoji: "🔤", desc: "Simple definitions" },
  { id: "study_plan", emoji: "📅", desc: "Tonight's steps" },
  { id: "focus_tip", emoji: "🎯", desc: "ADHD-friendly" },
];

function textToSpeakForAction(res: StudentChatActionResponse): string {
  const parts: string[] = [];
  if (res.message?.trim()) parts.push(res.message.trim());
  const p = res.payload as Record<string, unknown>;
  if (res.action === "summarize" && Array.isArray(p.bullets)) {
    parts.push(...(p.bullets as string[]).slice(0, 4));
  } else if (res.action === "focus_tip" && p.tip) {
    parts.push(String(p.tip));
  } else if (res.action === "vocab" && Array.isArray(p.terms)) {
    for (const t of (p.terms as { term: string; definition: string }[]).slice(0, 3)) {
      parts.push(`${t.term}: ${t.definition}`);
    }
  }
  return parts.join(". ");
}

function IlmVoice({ text }: { text: string }) {
  return <p className="text-sm text-bark-deep leading-relaxed mb-2">{text}</p>;
}

function ActionCard({ data }: { data: StudentChatActionResponse }) {
  const p = data.payload as Record<string, unknown>;
  const intro = data.message?.trim();
  if (data.action === "summarize" && Array.isArray(p.bullets)) {
    return (
      <div className="space-y-2">
        {intro && <IlmVoice text={intro} />}
        <p className="font-bold text-bark-deep text-sm">
          {(p.emoji as string) ?? "📋"} {(p.title as string) ?? "Quick recap"}
        </p>
        <ul className="space-y-1.5">
          {(p.bullets as string[]).map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-bark-deep">
              <span className="text-sage font-bold shrink-0">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (data.action === "quiz" && Array.isArray(p.questions)) {
    return (
      <div className="space-y-3">
        {intro && <IlmVoice text={intro} />}
        <p className="font-bold text-bark-deep text-sm">❓ Quiz: {String(p.concept ?? "")}</p>
        {(p.questions as { question: string; options: string[]; hint: string }[]).map((q, i) => (
          <div key={i} className="bg-white/80 rounded-xl p-3 border border-sand-mid">
            <p className="text-sm font-semibold text-bark-deep mb-2">
              {i + 1}. {q.question}
            </p>
            <div className="space-y-1">
              {q.options.map((opt, j) => (
                <p key={j} className="text-xs text-bark-soft pl-2">
                  {String.fromCharCode(65 + j)}. {opt}
                </p>
              ))}
            </div>
            {q.hint && <p className="text-[10px] text-sage-hi mt-2 italic">💡 {q.hint}</p>}
          </div>
        ))}
        <p className="text-[10px] text-bark-faint">Pick in your head, then ask me if you want to check — no stress lah.</p>
      </div>
    );
  }
  if (data.action === "vocab" && Array.isArray(p.terms)) {
    return (
      <div className="space-y-2">
        {intro && <IlmVoice text={intro} />}
        {(p.terms as { term: string; definition: string; example: string; emoji?: string }[]).map((t, i) => (
          <div key={i} className="bg-white/80 rounded-xl p-3 border border-sand-mid">
            <p className="font-bold text-bark-deep text-sm">
              {t.emoji ?? "📖"} {t.term}
            </p>
            <p className="text-xs text-bark-deep mt-1">{t.definition}</p>
            {t.example && <p className="text-[10px] text-bark-faint mt-1 italic">e.g. {t.example}</p>}
          </div>
        ))}
      </div>
    );
  }
  if (data.action === "study_plan" && Array.isArray(p.steps)) {
    return (
      <div className="space-y-2">
        {intro && <IlmVoice text={intro} />}
        {(p.steps as { title: string; minutes: number; task: string; emoji?: string }[]).map((s, i) => (
          <div key={i} className="flex gap-3 bg-white/80 rounded-xl p-3 border border-sand-mid">
            <span className="text-xl shrink-0">{s.emoji ?? "✓"}</span>
            <div>
              <p className="font-bold text-bark-deep text-sm">
                {s.title}{" "}
                <span className="text-bark-faint font-normal">({s.minutes} min)</span>
              </p>
              <p className="text-xs text-bark-soft mt-0.5">{s.task}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (data.action === "focus_tip") {
    return (
      <div className="space-y-2">
        {intro && <IlmVoice text={intro} />}
      <div className="bg-honey-lo rounded-xl p-3 border border-honey">
        <p className="font-bold text-bark-deep text-sm">
          {(p.emoji as string) ?? "🎯"} {String(p.tip ?? "")}
        </p>
        {Boolean(p.why) && <p className="text-xs text-bark-soft mt-2">{String(p.why)}</p>}
        {Boolean(p.try_this) && (
          <p className="text-xs font-semibold text-bark-deep mt-2">Try: {String(p.try_this)}</p>
        )}
      </div>
      </div>
    );
  }
  return <p className="text-sm text-bark-deep">{data.message}</p>;
}

export function StudentIlmChat({
  fileId,
  pockets,
  mood,
  lang,
  landingMode = false,
  appExtras = {},
}: {
  fileId: string | null;
  pockets: PocketsResponse | null;
  mood: string;
  lang: Language;
  landingMode?: boolean;
  appExtras?: AppContextExtras;
}) {
  const appPage: AssistantPage = landingMode ? "landing" : "student";
  const ui = useUiStrings();
  const welcome = landingMode
    ? ui.ilm.welcomeLanding
    : fileId
      ? ui.ilm.welcomeReady
      : ui.ilm.welcomeNoFile;

  const actions = ACTION_META.map((a) => ({
    ...a,
    label:
      a.id === "summarize"
        ? ui.ilm.actions.summarize
        : a.id === "quiz"
          ? ui.ilm.actions.quiz
          : a.id === "vocab"
            ? ui.ilm.actions.vocab
            : a.id === "study_plan"
              ? ui.ilm.actions.studyPlan
              : ui.ilm.actions.focusTip,
  }));

  const [open, setOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatItem[]>([{ from: "bot", text: welcome }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatTracked = useRef(false);
  const chatSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (open && !chatTracked.current) {
      chatTracked.current = true;
      trackEvent("chatbot_open", { topic: "Ilm student actions" });
    }
  }, [open]);

  // Fresh chat per document so old robotic replies don't carry over
  useEffect(() => {
    chatSessionRef.current = null;
    setMsgs([{ from: "bot", text: welcome }]);
    setSuggestions([]);
  }, [fileId, welcome, lang]);

  async function runAction(action: (typeof ACTION_META)[number]["id"]) {
    if (!fileId || thinking) return;
    const act = actions.find((a) => a.id === action);
    setMsgs((m) => [...m, { from: "user", text: `${act?.emoji ?? ""} ${act?.label ?? action}` }]);
    setThinking(true);
    try {
      const res = await api.studentChatAction(fileId, action, lang, mood);
      setMsgs((m) => [...m, { from: "bot", action: res }]);
      if (getAccSettings().autoRead) speakIlmReply(textToSpeakForAction(res), lang);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Couldn't run that action — try again in a sec." }]);
    } finally {
      setThinking(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }

  async function sendFreeChat(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || thinking) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text: msg }]);
    setThinking(true);
    setSuggestions([]);
    try {
      if (!chatSessionRef.current) {
        const { session_id } = await api.newChatSession();
        chatSessionRef.current = session_id;
      }
      const appContext = buildAppContextSnapshot(appPage, lang, {
        hasFile: !!fileId,
        mood,
        ...appExtras,
      });
      const res = await api.sendChat(
        chatSessionRef.current,
        msg,
        "student",
        fileId ?? undefined,
        mood,
        lang,
        { appPage, appContext }
      );
      setMsgs((m) => [...m, { from: "bot", text: res.message }]);
      setSuggestions(res.suggestions ?? []);
      if (getAccSettings().autoRead) speakIlmReply(res.message, lang);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          from: "bot",
          text: "Hmm, something went wrong. Check the backend is running and ILMU_API_KEY is set — or try an action button above.",
        },
      ]);
    } finally {
      setThinking(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ilm study buddy"
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 w-14 h-14 bg-sage rounded-full shadow-lg flex items-center justify-center text-2xl hover:opacity-85 transition-opacity z-[45]"
      >
        {open ? "✕" : "✦"}
      </button>
      {open && (
        <div
          className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-7 sm:w-[22rem] bg-parch rounded-2xl shadow-2xl border border-sand-mid flex flex-col z-50 animate-chat"
          style={{ height: 560, maxWidth: 360 }}
        >
          <div className="rounded-t-2xl px-4 py-3 flex items-center gap-3 shrink-0 bg-sage">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
              ✦
            </div>
            <div>
              <p className="text-white font-bold text-sm">Ilm</p>
              <p className="text-white/80 text-xs">{ui.ilm.tagline}</p>
            </div>
            {fileId && (
              <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                doc ✓
              </span>
            )}
          </div>

          {fileId ? (
            <div className="px-3 pt-2 pb-1 border-b border-sand-mid shrink-0">
              <button
                type="button"
                onClick={() => setActionsOpen((o) => !o)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-bark-faint uppercase tracking-wider mb-1.5 hover:text-bark-deep"
                aria-expanded={actionsOpen}
              >
                Quick actions
                <span aria-hidden>{actionsOpen ? "▾" : "▸"}</span>
              </button>
              {actionsOpen && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {actions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      disabled={thinking}
                      onClick={() => runAction(a.id)}
                      title={a.desc}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-sand hover:bg-sage-lo hover:text-sage-hi border border-sand-mid disabled:opacity-50 transition-colors"
                    >
                      <span>{a.emoji}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "bg-sage text-white rounded-tr-sm"
                      : "bg-sand text-bark-deep rounded-tl-sm"
                  }`}
                >
                  {"text" in m ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <ActionCard data={m.action} />
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-sand rounded-2xl px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-sand-mid bg-parch/80">
            {suggestions.length > 0 && (
              <div className="px-3 pt-2.5 pb-2 flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendFreeChat(s)}
                      className="text-[11px] bg-sage-lo text-sage-hi px-3 py-1 rounded-full font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-3 pb-3 pt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendFreeChat()}
              disabled={thinking}
              placeholder={ui.ilm.placeholder}
              className="flex-1 bg-sand rounded-xl px-3 py-2 text-sm text-bark-deep placeholder-bark-faint focus:outline-none focus:ring-2 focus:ring-sage"
            />
            <button
              type="button"
              onClick={() => sendFreeChat()}
              disabled={thinking}
              className="w-9 h-9 bg-sage rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-40"
            >
              →
            </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
