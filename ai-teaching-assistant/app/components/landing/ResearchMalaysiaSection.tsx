"use client";

import { IlmSectionLabel } from "@/app/components/ilm/IlmSectionLabel";
import { useLandingCopy } from "@/lib/use-ui-strings";

const EMOJI = ["🧩", "🗺️", "🌐", "🇲🇾"];

export function ResearchMalaysiaSection() {
  const L = useLandingCopy();

  return (
    <section aria-labelledby="why-heading" className="scroll-mt-20">
      <IlmSectionLabel>{L.research.label}</IlmSectionLabel>
      <h2 id="why-heading" className="font-serif text-2xl font-semibold text-bark-deep mb-3">
        {L.research.title}
      </h2>
      <ul className="grid sm:grid-cols-2 gap-2 max-w-2xl">
        {L.research.bullets.map((text, i) => (
          <li
            key={text}
            className="flex items-center gap-2 bg-parch rounded-xl border border-sand-mid px-3 py-2.5 text-sm text-bark-deep"
          >
            <span aria-hidden>{EMOJI[i] ?? "•"}</span>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
