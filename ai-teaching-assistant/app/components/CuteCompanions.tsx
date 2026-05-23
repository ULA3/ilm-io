"use client";

import { useEffect, useState } from "react";

type Buddy = {
  id: string;
  label: string;
  className: string;
  anim: string;
  style?: React.CSSProperties;
  node: React.ReactNode;
};

function Bunny() {
  return (
    <svg viewBox="0 0 56 56" className="w-11 h-11 sm:w-14 sm:h-14 drop-shadow-sm" aria-hidden>
      <ellipse cx="28" cy="34" rx="16" ry="13" fill="var(--c-sage-lo)" stroke="var(--c-sage)" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="7" ry="11" fill="var(--c-sage-lo)" stroke="var(--c-sage)" strokeWidth="1.5" />
      <ellipse cx="40" cy="16" rx="7" ry="11" fill="var(--c-sage-lo)" stroke="var(--c-sage)" strokeWidth="1.5" />
      <circle cx="22" cy="32" r="2" fill="var(--c-bark-deep)" />
      <circle cx="34" cy="32" r="2" fill="var(--c-bark-deep)" />
      <ellipse cx="28" cy="38" rx="3" ry="2" fill="var(--c-terra)" opacity="0.6" />
    </svg>
  );
}

function Frog() {
  return (
    <svg viewBox="0 0 56 56" className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-sm" aria-hidden>
      <ellipse cx="28" cy="32" rx="18" ry="14" fill="var(--c-sage-mid)" stroke="var(--c-sage-hi)" strokeWidth="1.5" />
      <circle cx="20" cy="26" r="5" fill="var(--c-cream)" stroke="var(--c-sage-hi)" strokeWidth="1" />
      <circle cx="36" cy="26" r="5" fill="var(--c-cream)" stroke="var(--c-sage-hi)" strokeWidth="1" />
      <circle cx="20" cy="26" r="2" fill="var(--c-bark-deep)" />
      <circle cx="36" cy="26" r="2" fill="var(--c-bark-deep)" />
      <path d="M24 36 Q28 40 32 36" stroke="var(--c-sage-hi)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Butterfly() {
  return (
    <svg viewBox="0 0 56 56" className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-sm" aria-hidden>
      <ellipse cx="18" cy="28" rx="12" ry="16" fill="var(--c-terra-lo)" stroke="var(--c-terra)" strokeWidth="1.2" opacity="0.9" />
      <ellipse cx="38" cy="28" rx="12" ry="16" fill="var(--c-terra-lo)" stroke="var(--c-terra)" strokeWidth="1.2" opacity="0.9" />
      <ellipse cx="28" cy="30" rx="3" ry="10" fill="var(--c-bark-soft)" />
    </svg>
  );
}

function Chick() {
  return (
    <svg viewBox="0 0 56 56" className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-sm" aria-hidden>
      <circle cx="28" cy="30" r="14" fill="var(--c-honey-lo)" stroke="var(--c-honey)" strokeWidth="1.5" />
      <circle cx="22" cy="26" r="2.5" fill="var(--c-bark-deep)" />
      <circle cx="34" cy="26" r="2.5" fill="var(--c-bark-deep)" />
      <path d="M26 34 L28 37 L30 34" stroke="var(--c-honey)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M28 16 L28 10 M24 12 L28 10 L32 12" stroke="var(--c-honey)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const BUDDIES: Buddy[] = [
  {
    id: "bunny",
    label: "Bunny",
    className: "companion-buddy companion-hop left-[4%] bottom-[18%]",
    anim: "companion-hop",
    style: { animationDuration: "4.2s", animationDelay: "0s" },
    node: <Bunny />,
  },
  {
    id: "frog",
    label: "Frog",
    className: "companion-buddy companion-walk left-0 bottom-[6%]",
    anim: "companion-walk",
    style: { animationDuration: "38s", animationDelay: "2s" },
    node: <Frog />,
  },
  {
    id: "butterfly",
    label: "Butterfly",
    className: "companion-buddy companion-flutter right-[8%] top-[22%]",
    anim: "companion-flutter",
    style: { animationDuration: "5.5s", animationDelay: "1s" },
    node: <Butterfly />,
  },
  {
    id: "chick",
    label: "Chick",
    className: "companion-buddy companion-hop right-[5%] bottom-[28%] hidden sm:block",
    anim: "companion-hop",
    style: { animationDuration: "3.8s", animationDelay: "0.6s" },
    node: <Chick />,
  },
];

export function CuteCompanions() {
  const [ok, setOk] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setOk(true);
    const check = () => {
      const reduced =
        document.body.classList.contains("reduce-motion") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setHidden(reduced);
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", check);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", check);
    };
  }, []);

  if (!ok || hidden) return null;

  return (
    <div
      className="companion-layer pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      aria-hidden
    >
      {BUDDIES.map((b) => (
        <div
          key={b.id}
          className={`${b.className} ${b.anim}`}
          style={b.style}
          title={b.label}
        >
          {b.node}
        </div>
      ))}
    </div>
  );
}
