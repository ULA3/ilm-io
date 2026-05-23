"use client";

import { ILM_SYSTEM_FLOW } from "@/lib/ilm-formats";

type Props = {
  compact?: boolean;
  className?: string;
};

/** Shows how upload → format → learn connects to dock, Ilm, mood */
export function SystemFlowStrip({ compact = false, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-sage/30 bg-sage-lo/40 px-3 py-3 ${className}`}
      role="img"
      aria-label="How ilm.io features connect: upload, format, learn, accessibility dock, Ilm assistant, and mood"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-sage-hi mb-2 text-center">
        One system · everything connects
      </p>
      <div
        className={`flex flex-wrap items-center justify-center gap-1 sm:gap-0 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        {ILM_SYSTEM_FLOW.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div
              className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-2 py-1.5 rounded-xl bg-parch/90 border border-sand-mid"
              title={step.hint}
            >
              <span aria-hidden>{step.emoji}</span>
              <span className="font-bold text-bark-deep">{step.label}</span>
              {!compact && (
                <span className="text-bark-faint hidden md:inline text-[10px]">· {step.hint}</span>
              )}
            </div>
            {i < ILM_SYSTEM_FLOW.length - 1 && (
              <span className="text-sage-hi px-0.5 sm:px-1 font-bold" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
