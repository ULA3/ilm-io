"use client";

import { getLanguageOptions, useIlmLanguage } from "@/lib/ilm-language";
import { useUiStrings } from "@/lib/use-ui-strings";

type Props = {
  className?: string;
  id?: string;
};

/** App-wide language — UI labels, slides, Ilm chat, and ILMU output follow this choice. */
export function IlmLanguageSelect({ className = "", id = "ilm-lang" }: Props) {
  const { lang, setLang, ready } = useIlmLanguage();
  const ui = useUiStrings();
  const options = getLanguageOptions(lang);

  if (!ready) {
    return (
      <label className={`block pb-2 ${className}`}>
        <span className="text-[10px] font-bold text-bark-faint uppercase block mb-1.5">
          {ui.lang.label}
        </span>
        <div className="h-10 rounded-xl bg-sand animate-pulse" />
      </label>
    );
  }

  return (
    <label htmlFor={id} className={`block pb-2 ${className}`}>
      <span className="text-[10px] font-bold text-bark-faint uppercase tracking-wide block mb-1.5">
        {ui.lang.label}
      </span>
      <select
        id={id}
        value={lang}
        onChange={(e) => setLang(e.target.value as typeof lang)}
        className="w-full rounded-xl border-2 border-sand-mid bg-parch px-3 py-2 text-sm font-semibold text-bark-deep focus:border-sage focus:outline-none"
      >
        {options.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
