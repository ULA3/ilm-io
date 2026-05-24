"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getFormat } from "@/lib/ilm-formats";
import {
  pickRandomLandingTopic,
  pickAnotherLandingTopic,
  type LandingDemoTopic,
} from "@/lib/landing-demo-topics";
import { FormatBadge } from "@/app/components/ilm/FormatBadge";
import type { SlideFormatKind } from "@/lib/ilm-formats";
import { useIlmLanguage } from "@/lib/ilm-language";
import { getDemoUiStrings, localizeDemoTopic } from "@/lib/landing-demo-i18n";
import { getFormatLabel } from "@/lib/localized-formats";

type CompareId = "original" | "adhd" | "mindmap" | "dyslexia";

function DemoImage({
  src,
  alt,
  className = "",
  fallbackEmoji,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackEmoji: string;
}) {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    setOk(true);
  }, [src]);
  return (
    <div className={`relative overflow-hidden bg-sand-mid ${className}`}>
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setOk(false)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-4xl bg-gradient-to-br from-sage-lo to-sand">
          {fallbackEmoji}
        </div>
      )}
    </div>
  );
}

function FlowDiagram({ steps }: { steps: LandingDemoTopic["flowSteps"] }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2" aria-hidden>
      {steps.map((s, i) => (
        <div key={`${s.label}-${i}`} className="flex flex-col items-center w-full">
          <div className="flex items-center gap-2 w-full max-w-[140px] rounded-xl bg-white/80 px-3 py-2 border border-terra/30 shadow-sm">
            <span className="text-xl">{s.icon}</span>
            <span className="text-[11px] font-bold text-bark-deep leading-tight">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <span className="text-terra-hi text-lg leading-none my-0.5">↓</span>
          )}
        </div>
      ))}
    </div>
  );
}

function CompareBody({
  id,
  topic,
  ui,
}: {
  id: CompareId;
  topic: LandingDemoTopic;
  ui: ReturnType<typeof getDemoUiStrings>;
}) {
  if (id === "original") {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-terra-hi uppercase tracking-wide">{ui.wallOfText}</p>
        <p className="text-bark-soft text-xs leading-relaxed line-clamp-6">{topic.original}</p>
        <p className="text-[10px] text-bark-faint italic">{ui.wallHint}</p>
      </div>
    );
  }
  if (id === "adhd") {
    const f = getFormat("adhd");
    return (
      <div className="space-y-2 text-sm text-bark-deep">
        <p className="font-semibold">{topic.focusHeadline}</p>
        <ol className="space-y-1.5 list-none">
          {topic.focusSteps.map((line, i) => (
            <li
              key={line}
              className={`flex gap-2 items-start bg-white/60 rounded-lg px-2 py-1.5 text-xs border ${f.theme.border}`}
            >
              <span
                className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${f.theme.dot}`}
              >
                {i + 1}
              </span>
              {line}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (id === "mindmap") {
    return (
      <div className="space-y-2">
        <FlowDiagram steps={topic.flowSteps} />
        <p className="text-[10px] text-center text-bark-faint">{ui.mindMapHint}</p>
      </div>
    );
  }
  if (id === "dyslexia") {
    return (
      <div className="space-y-2 text-sm text-bark-deep">
        <p className="text-xs leading-relaxed">
          <span className="font-bold text-[#1A5C96]">EN:</span> {topic.exampleEn}
        </p>
        <p className="text-xs leading-relaxed">
          <span className="font-bold text-[#1A5C96]">BM:</span> {topic.exampleBm}
        </p>
        <p className="text-xs bg-white/70 rounded-xl px-2 py-2 border border-[#1A5C96]/30">
          🇲🇾 <strong>{ui.realLife}</strong> {topic.exampleLocal}
        </p>
      </div>
    );
  }
  return null;
}

function imageForColumn(id: CompareId, topic: LandingDemoTopic) {
  if (id === "original")
    return { src: topic.images.original, alt: topic.topic, emoji: "📄" };
  if (id === "adhd")
    return { src: topic.images.focus, alt: "Focus slides", emoji: getFormat("adhd").emoji };
  if (id === "mindmap")
    return { src: topic.images.visual, alt: "Diagram", emoji: getFormat("mindmap").emoji };
  if (id === "dyslexia")
    return { src: topic.images.local, alt: "Local example", emoji: topic.emoji };
  return { src: topic.images.hero, alt: topic.topic, emoji: topic.emoji };
}

export function TransformComparisonDemo() {
  const { lang } = useIlmLanguage();
  const ui = getDemoUiStrings(lang);
  const [baseTopic, setBaseTopic] = useState<LandingDemoTopic | null>(null);
  const [focus, setFocus] = useState<CompareId | null>(null);
  const [imgKey, setImgKey] = useState(0);

  const topic = useMemo(
    () => (baseTopic ? localizeDemoTopic(baseTopic, lang) : null),
    [baseTopic, lang]
  );

  useEffect(() => {
    setBaseTopic(pickRandomLandingTopic());
  }, []);

  const shuffleTopic = useCallback(() => {
    setBaseTopic((t) => (t ? pickAnotherLandingTopic(t.id) : pickRandomLandingTopic()));
    setFocus(null);
    setImgKey((k) => k + 1);
  }, []);

  if (!topic) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 rounded-2xl bg-sand" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-sand" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-bark-faint">{ui.newTopicHint}</p>
        <button
          type="button"
          onClick={shuffleTopic}
          className="text-xs font-semibold text-sage-hi bg-sage-lo px-3 py-1.5 rounded-xl hover:bg-sage/20 transition-colors"
        >
          {ui.anotherTopic}
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-sage/40" key={`hero-${topic.id}-${imgKey}-${lang}`}>
        <DemoImage
          src={topic.images.hero}
          alt={`${topic.topic} illustration`}
          className="h-24 sm:h-28"
          fallbackEmoji={topic.emoji}
        />
        <p className="text-sm font-bold text-bark-deep px-3 pt-3 pb-2.5 bg-parch border-t border-sand-mid">
          <span className="mr-1" aria-hidden>
            {topic.emoji}
          </span>
          {topic.topic} · {topic.topicMs}
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        role="group"
        aria-label={`Compare learning formats for ${topic.topic}`}
        key={`grid-${topic.id}-${imgKey}-${lang}`}
      >
        {ui.compareColumns.map((col) => {
          const colId = col.id as CompareId;
          const f = colId !== "original" ? getFormat(colId as SlideFormatKind) : null;
          const img = imageForColumn(colId, topic);
          const dim = focus !== null && focus !== colId;
          const border = f ? f.theme.border : "border-sand-mid";
          const panel = f ? f.theme.bgLo : "bg-sand";

          return (
            <article
              key={col.id}
              onMouseEnter={() => setFocus(colId)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(colId)}
              onBlur={() => setFocus(null)}
              tabIndex={0}
              className={`flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-sage ${border} ${
                dim ? "opacity-55 scale-[0.98]" : "opacity-100 scale-100 shadow-lg"
              } ${focus === colId ? "ring-2 ring-sage ring-offset-2 ring-offset-cream" : ""}`}
            >
              <header className="px-3 py-2 bg-white/70 border-b border-inherit shrink-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-bark-deep">{col.label}</p>
                  {colId !== "original" && <FormatBadge kind={colId as SlideFormatKind} />}
                </div>
                <p className="text-[10px] text-bark-faint">{col.tag}</p>
              </header>

              <DemoImage
                src={img.src}
                alt={img.alt}
                className="h-20 sm:h-24 shrink-0"
                fallbackEmoji={img.emoji}
              />

              <div className={`flex-1 p-3 sm:p-4 text-left ${panel}`}>
                <CompareBody id={colId} topic={topic} ui={ui} />
              </div>

              {colId !== "original" && (
                <p className="text-[9px] text-bark-faint px-2 pt-2 pb-2 border-t border-black/5 mt-1">
                  → {getFormatLabel(lang, colId as SlideFormatKind)} {ui.inAppSuffix}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
