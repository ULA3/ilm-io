"use client";

import { useMemo, useState } from "react";
import { conceptEmoji, slideImageUrl } from "@/lib/slide-visual";

type Props = {
  visualHint?: string;
  visualDescription?: string;
  title?: string;
  topic?: string;
  variant?: "card" | "banner";
  className?: string;
};

export function SlideVisual({
  visualHint,
  visualDescription,
  title,
  topic,
  variant = "card",
  className = "",
}: Props) {
  const hint = (visualHint || visualDescription || "").trim();
  const [status, setStatus] = useState<"loading" | "ok" | "fallback">("loading");

  const src = useMemo(
    () => (hint || title ? slideImageUrl(hint || title || "learning", title, topic) : ""),
    [hint, title, topic]
  );
  const emoji = useMemo(() => conceptEmoji(hint || title || "learning", title), [hint, title]);

  if (!hint && !title) return null;

  const heightClass = variant === "banner" ? "h-36 sm:h-44" : "h-40 sm:h-48";

  return (
    <div
      className={`rounded-xl overflow-hidden border border-sand-mid bg-sand/50 ${className}`}
      aria-label={hint ? `Visual: ${hint}` : "Slide visual"}
    >
      <div className={`relative w-full ${heightClass} bg-sand-mid`}>
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
            <span className="sr-only">Loading illustration</span>
          </div>
        )}
        {status === "fallback" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-sage-lo to-sand p-4">
            <span className="text-5xl" aria-hidden>
              {emoji}
            </span>
            <p className="text-xs text-bark-soft text-center line-clamp-2">{hint || title}</p>
          </div>
        ) : (
          src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={hint || `Illustration for ${title ?? "slide"}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                status === "ok" ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onLoad={() => setStatus("ok")}
              onError={() => setStatus("fallback")}
            />
          )
        )}
      </div>
      {hint && (
        <p className="text-[10px] text-bark-faint px-3 py-2 leading-snug border-t border-sand-mid bg-parch/80">
          <span className="font-semibold text-bark-soft">Visual idea:</span> {hint}
        </p>
      )}
    </div>
  );
}
