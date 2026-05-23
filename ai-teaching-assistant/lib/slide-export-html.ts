/** Build printable HTML bodies for DownloadBar (PDF / PNG) */

import { slideImageUrl } from "./slide-visual";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function visualImgHtml(hint: string, title?: string, topic?: string): string {
  if (!hint && !title) return "";
  const src = slideImageUrl(hint || title || "learning", title, topic);
  const caption = esc(hint || title || "");
  return `<div style="margin:14px 0;border-radius:12px;overflow:hidden;border:1px solid #ddd;background:#f8f8f8">
<img src="${src}" alt="${caption}" style="width:100%;max-height:220px;object-fit:cover;display:block" crossorigin="anonymous" />
${hint ? `<p style="font-size:11px;color:#555;padding:8px 12px;margin:0;border-top:1px solid #eee"><strong>Visual:</strong> ${caption}</p>` : ""}
</div>`;
}

export function buildFocusSlidesHtml(
  slides: {
    index?: number;
    title?: string;
    bullets?: string[];
    focus_question?: string;
    timer_minutes?: number;
    visual_hint?: string;
  }[],
  topic: string
): string {
  return slides
    .map(
      (s, i) => `<div class="slide" style="border-left:6px solid #009688">
<p class="tag">Focus slide ${s.index ?? i + 1}</p>
<h2>${esc(s.title ?? "")}</h2>
${visualImgHtml(s.visual_hint ?? "", s.title, topic)}
${s.timer_minutes ? `<p><strong>⏱ Focus:</strong> ${s.timer_minutes} min</p>` : ""}
${s.focus_question ? `<p><em>🎯 ${esc(s.focus_question)}</em></p>` : ""}
<ul>${(s.bullets ?? []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
</div>`
    )
    .join("");
}

export function buildCalmSlidesHtml(
  slides: {
    index?: number;
    heading?: string;
    what?: string;
    details?: string[];
    why_it_matters?: string;
    visual_description?: string;
  }[],
  topic = ""
): string {
  return slides
    .map(
      (s, i) => `<div class="slide" style="border-left:6px solid #1a237e;background:#f5f6ff">
<p class="tag">Clear & calm · slide ${s.index ?? i + 1} — same layout every time</p>
<h2 style="color:#1a237e">${esc(s.heading ?? "")}</h2>
${visualImgHtml(s.visual_description ?? "", s.heading, topic)}
<p><strong>What:</strong> ${esc(s.what ?? "")}</p>
<ol>${(s.details ?? []).map((d) => `<li>${esc(d)}</li>`).join("")}</ol>
${s.why_it_matters ? `<p><strong>Why it matters:</strong> ${esc(s.why_it_matters)}</p>` : ""}
</div>`
    )
    .join("");
}

export function buildEasyReadHtml(
  slides: {
    index?: number;
    title?: string;
    bullets?: string[];
    key_phrase?: string;
    reading_note?: string;
    visual_hint?: string;
  }[],
  topic = ""
): string {
  return slides
    .map(
      (s, i) => `<div class="slide" style="border-left:6px solid #1a5c96;font-size:18px;line-height:2">
<p class="tag">Easy read · slide ${s.index ?? i + 1}</p>
<h2 style="font-size:24px;letter-spacing:0.02em">${esc(s.title ?? "")}</h2>
${visualImgHtml(s.visual_hint ?? "", s.title, topic)}
<ul style="line-height:2.2">${(s.bullets ?? []).map((b) => `<li style="margin:14px 0">${esc(b)}</li>`).join("")}</ul>
${s.key_phrase ? `<p style="background:#fff080;padding:12px;font-weight:bold">${esc(s.key_phrase)}</p>` : ""}
${s.reading_note ? `<p style="color:#1a5c96"><em>📖 ${esc(s.reading_note)}</em></p>` : ""}
</div>`
    )
    .join("");
}

export function buildMindmapHtml(mm: {
  topic?: string;
  summary?: string;
  branches?: { label: string; emoji?: string; subnodes: string[] }[];
  fun_facts?: string[];
}): string {
  const branches = (mm.branches ?? [])
    .map(
      (b) => `<div class="part" style="border-color:#7344b8">
<h3>${b.emoji ?? "🌿"} ${esc(b.label)}</h3>
<ul>${b.subnodes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
</div>`
    )
    .join("");
  return `<div class="slide" style="text-align:center;background:#f5f3ff;border:3px solid #7344b8">
<h2>${esc(mm.topic ?? "Mind map")}</h2>
<p>${esc(mm.summary ?? "")}</p>
</div>${branches}
${(mm.fun_facts ?? []).length ? `<h3>Fun facts</h3><ul>${mm.fun_facts!.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}`;
}
