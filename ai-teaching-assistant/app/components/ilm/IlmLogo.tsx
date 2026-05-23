import { IlmWordmark } from "@/app/components/ilm/IlmWordmark";

/**
 * ilm.io logo — "one leaf, four paths" (Focus · Calm · Easy Read · Visual)
 * SVG mark + optional wordmark. Replaces placeholder ✦ across the app.
 */

type Variant = "sage" | "terra" | "white-on-sage" | "white-on-terra";

const VARIANT_BG: Record<Variant, string> = {
  sage: "bg-sage",
  terra: "bg-terra",
  "white-on-sage": "bg-sage",
  "white-on-terra": "bg-terra",
};

type Props = {
  /** Icon box size in Tailwind units (w/h) */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: Variant;
  showWordmark?: boolean;
  /** Match wordmark size to icon scale */
  wordmarkSize?: "sm" | "md" | "lg" | "hero";
  className?: string;
};

const SIZES = {
  xs: { box: "w-7 h-7", icon: 20, wordmark: "sm" as const },
  sm: { box: "w-8 h-8", icon: 24, wordmark: "sm" as const },
  md: { box: "w-10 h-10", icon: 28, wordmark: "md" as const },
  lg: { box: "w-14 h-14", icon: 40, wordmark: "lg" as const },
  xl: { box: "w-16 h-16", icon: 48, wordmark: "hero" as const },
};

/** Four format pathway colours (matches lib/ilm-formats.ts) */
const PATHS = [
  { d: "M32 28 C22 18 14 14 8 8", stroke: "#7B9BAD", fill: "#D8E5ED" }, // dust — Focus
  { d: "M32 28 C42 18 50 14 56 8", stroke: "#D4A853", fill: "#F5E9C8" }, // honey — Calm
  { d: "M32 28 C38 38 44 48 50 56", stroke: "#C27D6E", fill: "#F5DDD9" }, // terra
  { d: "M32 28 C26 38 20 48 14 56", stroke: "#5E7D5C", fill: "#DCE8DB" }, // sage — Easy Read
];

function LogoMark({ size, monochrome }: { size: number; monochrome?: boolean }) {
  const leafFill = monochrome ? "currentColor" : "#8FA68E";
  const leafStroke = monochrome ? "currentColor" : "#5E7D5C";
  const stem = monochrome ? "currentColor" : "#5E7D5C";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Four learning paths */}
      {PATHS.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={monochrome ? "currentColor" : p.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity={monochrome ? 0.35 : 1}
        />
      ))}
      {/* Path nodes */}
      {monochrome ? null : (
        <>
          <circle cx="8" cy="8" r="3" fill={PATHS[0].fill} stroke={PATHS[0].stroke} strokeWidth="1.5" />
          <circle cx="56" cy="8" r="3" fill={PATHS[1].fill} stroke={PATHS[1].stroke} strokeWidth="1.5" />
          <circle cx="14" cy="56" r="3" fill={PATHS[3].fill} stroke={PATHS[3].stroke} strokeWidth="1.5" />
          <circle cx="50" cy="56" r="3" fill={PATHS[2].fill} stroke={PATHS[2].stroke} strokeWidth="1.5" />
        </>
      )}
      {/* Central leaf */}
      <path
        d="M32 52 C24 44 20 36 22 28 C24 20 28 14 32 10 C36 14 40 20 42 28 C44 36 40 44 32 52 Z"
        fill={leafFill}
        stroke={leafStroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 52 L32 28"
        stroke={stem}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={monochrome ? 0.6 : 1}
      />
    </svg>
  );
}

export function IlmLogo({
  size = "sm",
  variant = "sage",
  showWordmark = false,
  wordmarkSize,
  className = "",
}: Props) {
  const s = SIZES[size];
  const mono = variant.startsWith("white-on");
  const iconColor = mono ? "text-white" : "text-sage-hi";

  return (
    <div className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <div
        className={`${s.box} ${VARIANT_BG[variant]} rounded-xl flex items-center justify-center shadow-sm ${iconColor}`}
      >
        <LogoMark size={s.icon} monochrome={mono} />
      </div>
      {showWordmark && <IlmWordmark size={wordmarkSize ?? s.wordmark} />}
    </div>
  );
}

/** Icon-only export for tight spaces (favicon-style) */
export function IlmLogoMark({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={`inline-flex ${className}`} role="img" aria-label="ilm.io">
      <LogoMark size={size} />
    </span>
  );
}
