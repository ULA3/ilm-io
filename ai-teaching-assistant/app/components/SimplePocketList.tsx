"use client";

import type { Pocket } from "@/lib/api";

/** Short topic list — less visual noise for neurodivergent users */
export function SimplePocketList({ pockets }: { pockets: Pocket[] }) {
  return (
    <ul className="space-y-1.5 max-h-40 overflow-y-auto">
      {pockets.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-2 text-xs text-bark-deep bg-sand/50 rounded-lg px-2 py-1.5"
        >
          <span className="text-bark-faint font-bold w-4 shrink-0">{p.id}</span>
          <span className="truncate flex-1">{p.concept}</span>
        </li>
      ))}
    </ul>
  );
}
