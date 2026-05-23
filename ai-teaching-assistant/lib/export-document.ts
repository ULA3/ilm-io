/** Client-side export helpers — PPTX from API, PDF/PNG via printable HTML */

export type ExportFmt = "pptx" | "pdf" | "png";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadHtmlFile(html: string, filename: string) {
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), filename);
}

export function openPrintablePdf(html: string, title: string) {
  const w = window.open("", "_blank");
  if (!w) {
    downloadHtmlFile(html, `${safeName(title)}.html`);
    return;
  }
  w.document.write(html);
  w.document.close();
  w.document.title = title;
  setTimeout(() => w.print(), 400);
}

function safeName(s: string) {
  return s.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "ilmio-export";
}

const PRINT_CSS = `
  @page { margin: 16mm; }
  @media print { body { margin: 0; } .no-print { display: none; } }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1c1c1c; line-height: 1.65; max-width: 800px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 22px; border-bottom: 3px solid #5e7d5c; padding-bottom: 8px; }
  .slide { page-break-after: always; margin-bottom: 32px; padding: 20px; border-radius: 12px; border: 2px solid #e8e0d4; }
  .slide:last-child { page-break-after: auto; }
  .tag { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.7; }
  ul { padding-left: 1.2em; }
  li { margin: 8px 0; }
  .hint { font-size: 12px; color: #666; font-style: italic; margin-top: 12px; }
`;

export function wrapPrintableHtml(title: string, body: string, accent = "#5e7d5c"): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>${PRINT_CSS} h1 { border-color: ${accent}; }</style></head><body>
<p class="no-print hint">Tip: File → Print → Save as PDF to get a PDF copy.</p>
<h1>${title}</h1>
${body}
</body></html>`;
}

export async function exportHtmlAsPng(html: string, filename: string): Promise<boolean> {
  try {
    const { default: html2canvas } = await import("html2canvas");
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;background:#fff;padding:24px;";
    host.innerHTML = html;
    document.body.appendChild(host);
    const canvas = await html2canvas(host, { scale: 2, backgroundColor: "#ffffff" });
    document.body.removeChild(host);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(false); return; }
        downloadBlob(blob, filename.endsWith(".png") ? filename : `${filename}.png`);
        resolve(true);
      }, "image/png");
    });
  } catch {
    return false;
  }
}
