/** One consistent ilm.io wordmark — use everywhere */

type Size = "sm" | "md" | "lg" | "hero";

const STYLES: Record<Size, { ilm: string; io: string }> = {
  sm: { ilm: "text-base", io: "text-sm" },
  md: { ilm: "text-lg", io: "text-base" },
  lg: { ilm: "text-xl", io: "text-lg" },
  hero: { ilm: "text-3xl sm:text-4xl", io: "text-2xl sm:text-3xl" },
};

export function IlmWordmark({
  size = "md",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const s = STYLES[size];
  return (
    <span
      className={`inline-flex items-baseline gap-0 font-serif font-semibold leading-none ${className}`}
      aria-label="ilm.io"
    >
      <span className={`text-bark-deep ${s.ilm}`}>ilm</span>
      <span className={`text-sage-hi ${s.io}`}>.io</span>
    </span>
  );
}
