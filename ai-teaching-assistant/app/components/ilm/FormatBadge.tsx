import { getFormat, type SlideFormatKind, type EducatorOutputKind } from "@/lib/ilm-formats";

type Props = {
  kind: SlideFormatKind | EducatorOutputKind;
  size?: "sm" | "md";
  showTag?: boolean;
  className?: string;
};

export function FormatBadge({ kind, size = "sm", showTag = false, className = "" }: Props) {
  const f = getFormat(kind as SlideFormatKind);
  const sizeClass = size === "md" ? "text-xs px-2.5 py-1" : "text-[10px] px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold border ${sizeClass} ${f.theme.chip} ${className}`}
    >
      <span aria-hidden>{f.emoji}</span>
      <span>{showTag ? f.tag : f.shortLabel}</span>
    </span>
  );
}
