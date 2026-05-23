"use client";

import type { IlmAssistantAction } from "@/lib/ilm-assistant-actions";

type Props = {
  actions: IlmAssistantAction[];
  onAction: (id: string) => void;
  disabled?: boolean;
  tone?: "sage" | "terra";
};

export function IlmActionChips({ actions, onAction, disabled, tone = "sage" }: Props) {
  if (!actions.length) return null;
  const chip =
    tone === "terra"
      ? "bg-terra-lo text-terra-hi border-terra-mid hover:bg-terra-mid"
      : "bg-sage-lo text-sage-hi border-sand-mid hover:bg-sage-mid";
  return (
    <div className="flex flex-wrap gap-1.5 shrink-0">
      {actions.map((a) => (
        <button
          key={a.id}
          type="button"
          disabled={disabled}
          onClick={() => onAction(a.id)}
          className={`text-[11px] px-3 py-1 rounded-full font-semibold border transition-colors disabled:opacity-50 ${chip}`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
