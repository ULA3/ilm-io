"use client";

import { useState, useEffect } from "react";

type AccSettings = {
  font: "default" | "dyslexic";
  size: "sm" | "md" | "lg";
  contrast: "normal" | "high";
  motion: "on" | "off";
  autoRead: boolean;
};

const DEFAULTS: AccSettings = {
  font: "default",
  size: "md",
  contrast: "normal",
  motion: "on",
  autoRead: false,
};

// Export for use by other components (e.g., chatbot auto-read)
export function getAccSettings(): AccSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const saved = localStorage.getItem("ilmio_acc");
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

export function AccessibilityWidget() {
  const [open, setOpen]         = useState(false);
  const [settings, setSettings] = useState<AccSettings>(DEFAULTS);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(getAccSettings());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applySettings(settings);
    localStorage.setItem("ilmio_acc", JSON.stringify(settings));
  }, [settings, mounted]);

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {/* Panel */}
      {open && (
        <div className="absolute bottom-14 left-0 w-72 bg-parch rounded-2xl shadow-2xl border border-sand-mid p-5 space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <p className="font-bold text-bark-deep text-sm">♿ Accessibility</p>
            <button onClick={() => setOpen(false)} className="text-bark-faint text-xs hover:text-bark-deep">✕</button>
          </div>

          <Row label="Font">
            <PillGroup
              options={[
                { key: "default", label: "Default" },
                { key: "dyslexic", label: "OpenDyslexic" },
              ]}
              active={settings.font}
              onSelect={v => setSettings(s => ({ ...s, font: v as AccSettings["font"] }))}
            />
          </Row>

          <Row label="Text Size">
            <PillGroup
              options={[
                { key: "sm", label: "Small" },
                { key: "md", label: "Medium" },
                { key: "lg", label: "Large" },
              ]}
              active={settings.size}
              onSelect={v => setSettings(s => ({ ...s, size: v as AccSettings["size"] }))}
            />
          </Row>

          <Row label="Animations">
            <PillGroup
              options={[
                { key: "on", label: "On" },
                { key: "off", label: "Stop all" },
              ]}
              active={settings.motion}
              onSelect={v => setSettings(s => ({ ...s, motion: v as AccSettings["motion"] }))}
            />
          </Row>

          <div className="flex items-center justify-between pt-1 border-t border-sand-mid">
            <p className="text-xs font-semibold text-bark-soft">Auto-read Ilm replies 🔊</p>
            <button
              onClick={() => setSettings(s => ({ ...s, autoRead: !s.autoRead }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.autoRead ? "bg-sage" : "bg-sand-mid"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.autoRead ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <button
            onClick={() => { setSettings(DEFAULTS); }}
            className="w-full text-center text-xs text-bark-faint hover:text-bark-deep transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Accessibility settings"
        aria-label="Accessibility settings"
        className={`w-11 h-11 rounded-2xl shadow-lg flex items-center justify-center text-lg transition-all ${
          open
            ? "bg-sage text-white"
            : "bg-parch border border-sand-mid text-bark-soft hover:text-bark-deep hover:border-bark-faint"
        }`}
      >
        ♿
      </button>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-bark-faint uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  );
}

function PillGroup({
  options,
  active,
  onSelect,
}: {
  options: { key: string; label: string }[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onSelect(o.key)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
            active === o.key
              ? "bg-sage text-white border-sage"
              : "bg-sand text-bark-soft border-sand-mid hover:border-sage"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Apply settings to DOM ───────────────────────────────────── */
function applySettings(s: AccSettings) {
  if (typeof document === "undefined") return;
  const body = document.body;

  // Font
  if (s.font === "dyslexic") {
    const id = "opendyslexic-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.cdnfonts.com/css/opendyslexic";
      document.head.appendChild(link);
    }
    body.style.fontFamily = "'OpenDyslexic', sans-serif";
  } else {
    body.style.fontFamily = "";
  }

  // Text size — must change html (root) font-size so rem-based Tailwind classes scale too
  document.documentElement.style.fontSize = s.size === "sm" ? "14px" : s.size === "lg" ? "18px" : "";

  // Contrast
  body.classList.toggle("high-contrast", s.contrast === "high");

  // Motion
  body.classList.toggle("reduce-motion", s.motion === "off");
}
