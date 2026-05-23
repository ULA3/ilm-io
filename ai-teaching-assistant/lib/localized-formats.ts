import type { Language } from "@/lib/api";
import {
  EDUCATOR_FORMAT_ORDER,
  ILM_FORMATS,
  STUDENT_FORMAT_ORDER,
  type EducatorOutputKind,
  type StudentOutputKind,
} from "@/lib/ilm-formats";
import { FORMAT_COPY } from "@/lib/ui-strings-formats";

export function getStudentOutputButtons(lang: Language) {
  return STUDENT_FORMAT_ORDER.map((kind) => {
    const style = ILM_FORMATS[kind];
    const copy = FORMAT_COPY[lang]?.[kind] ?? FORMAT_COPY.en[kind];
    return {
      kind,
      emoji: style.emoji,
      label: copy.label,
      sub: copy.sub,
      why: copy.why,
      helps: [copy.tag],
      color: style.studentColor,
      active: style.studentActive,
      theme: style.theme,
    };
  });
}

export function getEducatorOutputOptions(lang: Language) {
  return EDUCATOR_FORMAT_ORDER.map((kind) => {
    const style = ILM_FORMATS[kind];
    const copy = FORMAT_COPY[lang]?.[kind] ?? FORMAT_COPY.en[kind];
    return {
      kind,
      emoji: style.emoji,
      title: copy.shortLabel,
      sub: copy.sub,
      tag: copy.tag,
      theme: style.theme,
    };
  });
}

export function getFormatLabel(lang: Language, kind: StudentOutputKind | EducatorOutputKind) {
  const copy = FORMAT_COPY[lang]?.[kind] ?? FORMAT_COPY.en[kind];
  return copy.label;
}
