"use client";

import { useState, useEffect } from "react";

const LABELS = [
  "Translating…",
  "翻译中…",
  "Menterjemah…",
  "மொழிபெயர்க்கிறேன்…",
];

export function TranslatingOverlay() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % LABELS.length);
        setFade(true);
      }, 200);
    }, 900);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="absolute inset-0 z-20 rounded-3xl flex flex-col items-center justify-center gap-5"
      style={{ background: "rgba(248,244,237,0.88)", backdropFilter: "blur(6px)" }}>

      {/* Concentric spinning rings */}
      <div className="relative w-20 h-20 shrink-0">
        <div className="absolute inset-0 rounded-full border-[3px] border-sage/25 border-t-sage animate-spin" style={{ animationDuration: "1s" }} />
        <div className="absolute inset-2.5 rounded-full border-[3px] border-dust/25 border-b-dust animate-spin" style={{ animationDuration: "1.4s", animationDirection: "reverse" }} />
        <div className="absolute inset-5 rounded-full border-[3px] border-honey/35 border-t-honey animate-spin" style={{ animationDuration: "0.8s" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/ilmio-logo-mark.png" alt="" className="w-8 h-8 object-contain" aria-hidden />
        </div>
      </div>

      {/* Cycling language text */}
      <div className="text-center space-y-1">
        <p className={`font-semibold text-bark-deep text-lg transition-opacity duration-200 ${fade ? "opacity-100" : "opacity-0"}`}>
          {LABELS[idx]}
        </p>
        <p className="text-bark-faint text-xs">Regenerating in new language…</p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse-dot"
            style={{ animationDelay: `${i * 180}ms` }} />
        ))}
      </div>
    </div>
  );
}
