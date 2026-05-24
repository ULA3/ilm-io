"use client";

import { useState } from "react";
import {
  type ExportFmt,
  downloadHtmlFile,
  openPrintablePdf,
  exportHtmlAsPng,
} from "@/lib/export-document";
import { trackEvent } from "@/lib/track";
import { apiUrl } from "@/lib/api-base";
import { useUiStrings } from "@/lib/use-ui-strings";

type Props = {
  title: string;
  pptxUrl?: string;
  /** HTML body (slides, mindmap, worksheet) for PDF / PNG export */
  htmlBody?: string;
  accentColor?: string;
  trackTopic?: string;
};

export function DownloadBar({ title, pptxUrl, htmlBody, accentColor = "#5e7d5c", trackTopic }: Props) {
  const ui = useUiStrings();
  const [fmt, setFmt] = useState<ExportFmt>("pptx");
  const [busy, setBusy] = useState(false);
  const safe = title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 36) || "ilmio";

  async function handleDownload() {
    const topic = trackTopic ?? title;
    if (fmt === "pptx" && pptxUrl) {
      trackEvent("download", { topic, format: "pptx" });
      window.location.href = apiUrl(pptxUrl);
      return;
    }
    if (!htmlBody) return;
    setBusy(true);
    try {
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:820px;margin:24px auto;padding:16px;color:#222;line-height:1.6}
h1{border-bottom:3px solid ${accentColor};padding-bottom:8px}
.slide,.part{margin:24px 0;padding:20px;border-radius:12px;border:2px solid #e8e0d4}
</style></head><body><h1>${title}</h1>${htmlBody}</body></html>`;

      if (fmt === "pdf") {
        trackEvent("download", { topic, format: "pdf" });
        openPrintablePdf(fullHtml, title);
      } else if (fmt === "png") {
        trackEvent("download", { topic, format: "png" });
        const ok = await exportHtmlAsPng(`<div style="font-family:system-ui;padding:16px">${htmlBody}</div>`, `${safe}.png`);
        if (!ok) downloadHtmlFile(fullHtml, `${safe}.html`);
      }
    } finally {
      setBusy(false);
    }
  }

  const canPptx = Boolean(pptxUrl);
  const canOther = Boolean(htmlBody);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex bg-sand rounded-xl p-0.5 gap-0.5">
        {(["pptx", "pdf", "png"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFmt(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
              fmt === f ? "bg-white shadow text-bark-deep" : "text-bark-faint hover:text-bark-deep"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy || (fmt === "pptx" ? !canPptx : !canOther)}
        className="flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-85 disabled:opacity-40 transition-opacity"
        style={{ backgroundColor: accentColor }}
      >
        {busy ? (
          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          "⬇"
        )}
        {ui.shared.download} {fmt.toUpperCase()}
      </button>
    </div>
  );
}
