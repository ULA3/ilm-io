"use client";

import { useEffect, useRef, useState } from "react";
import * as api from "@/lib/api";
import type { IlmuistResponse, PocketsResponse } from "@/lib/api";
import type { Language } from "@/lib/api";
import { useUiStrings } from "@/lib/use-ui-strings";
import { trackEvent } from "@/lib/track";
import { buildAppContextSnapshot, type AppContextExtras } from "@/lib/app-context";

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
        return (
          <p key={i} className={i > 0 ? "mt-1" : ""}>
            {line}
          </p>
        );
      })}
    </>
  );
}

type Props = {
  fileId: string | null;
  fileName?: string;
  pockets: PocketsResponse | null;
  generatedOutputs: string[];
  lang: Language;
  appExtras?: AppContextExtras;
};

export function EducatorIlmChat({
  fileId,
  fileName,
  pockets,
  generatedOutputs,
  lang,
  appExtras = {},
}: Props) {
  const ui = useUiStrings();
  const ed = ui.educator;

  const welcome = fileId && pockets ? ed.welcomeReady : ed.welcomeNoFile;

  const quickPrompts = [
    ed.prompts.format,
    ed.prompts.observer,
    ed.prompts.worksheet,
    ed.prompts.dyslexia,
  ];

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ from: string; text: string }[]>([{ from: "bot", text: welcome }]);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatTracked = useRef(false);

  useEffect(() => {
    if (open && !chatTracked.current) {
      chatTracked.current = true;
      trackEvent("chatbot_open", { topic: "Ilm Educator chat" });
    }
  }, [open]);

  useEffect(() => {
    setMsgs([{ from: "bot", text: welcome }]);
    setHistory([]);
    setSuggestions([]);
  }, [fileId, welcome, lang]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || thinking) return;
    setInput("");
    const newHistory = [...history, { role: "user", content: msg }];
    setHistory(newHistory);
    setMsgs((m) => [...m, { from: "user", text: msg }]);
    setThinking(true);
    setSuggestions([]);
    try {
      const appContext = buildAppContextSnapshot("educator", lang, {
        hasFile: !!fileId,
        filename: fileName,
        ...appExtras,
      });
      const res: IlmuistResponse = await api.agentEducatorChat(msg, newHistory, {
        fileId: fileId ?? undefined,
        lang,
        filename: fileName,
        topic: pockets?.topic,
        pocketCount: pockets?.pockets.length,
        generatedOutputs,
        appPage: "educator",
        appContext,
      });
      setMsgs((m) => [...m, { from: "bot", text: res.message }]);
      setHistory((h) => [...h, { role: "assistant", content: res.message }]);
      setSuggestions(res.suggestions ?? []);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: ed.error }]);
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
        aria-label={ed.title}
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 w-14 h-14 bg-terra rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-terra-hi transition-colors z-50"
      >
        {open ? "✕" : "✦"}
      </button>
      {open && (
        <div
          className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-7 sm:w-84 bg-parch rounded-2xl shadow-2xl border border-sand-mid flex flex-col z-50"
          style={{ height: 520, maxWidth: 360 }}
        >
          <div className="bg-terra rounded-t-2xl px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg">
              ✦
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">{ed.title}</p>
              <p className="text-white/70 text-xs truncate">{ed.subtitle}</p>
            </div>
            {fileId && (
              <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
                {ed.docLoaded}
              </span>
            )}
          </div>

          <div className="px-3 pt-2 pb-1 border-b border-sand-mid shrink-0">
            <p className="text-[10px] font-bold text-bark-faint uppercase tracking-wider mb-1.5">
              {ed.quickActions}
            </p>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={thinking}
                  onClick={() => send(q)}
                  className="text-[11px] bg-terra-lo text-terra-hi px-2.5 py-1 rounded-full hover:bg-terra-mid transition-colors font-medium disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "bg-terra text-white rounded-tr-sm"
                      : "bg-sand text-bark-deep rounded-tl-sm"
                  }`}
                >
                  <ChatText text={m.text} />
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-sand rounded-2xl px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-terra rounded-full animate-pulse"
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
                      onClick={() => send(s)}
                      className="text-[11px] bg-sand text-bark-deep px-3 py-1 rounded-full hover:bg-sand-mid transition-colors font-medium border border-sand-mid"
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
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={ed.placeholder}
              className="flex-1 bg-sand rounded-xl px-3 py-2 text-sm text-bark-deep placeholder-bark-faint focus:outline-none focus:ring-2 focus:ring-terra"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={thinking}
              className="w-9 h-9 bg-terra rounded-xl flex items-center justify-center text-white hover:bg-terra-hi transition-colors shrink-0 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
