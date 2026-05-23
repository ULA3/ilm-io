"use client";

import React, { useState, useEffect } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import { getAccSettings } from "./AccessibilityWidget";

type AccSettings = {
  font: "default" | "dyslexic";
  size: "sm" | "md" | "lg";
  contrast: "normal" | "high";
  motion: "on" | "off";
  autoRead: boolean;
};

const DEFAULTS: AccSettings = {
  font: "default", size: "md", contrast: "normal", motion: "on", autoRead: false,
};

const PLAYLIST = [
  { title: "Relaxing Guitar",  src: "/music/freesound_community-simple-relaxing-guitar-loop-60828.mp3" },
  { title: "Forest & River",   src: "/music/freesound_community-forest-with-small-river-birds-and-nature-field-recording-6735.mp3" },
  { title: "River in Forest",  src: "/music/freesound_community-river-in-the-forest-17271.mp3" },
  { title: "Fire Ambience",    src: "/music/soundreality-fire-relaxing-528619.mp3" },
  { title: "Rain Sounds",      src: "/music/dragon-studio-copyright-free-rain-sounds-331497.mp3" },
  { title: "British Woods",    src: "/music/freesound_community-british-woods-ambient-noise-24942.mp3" },
  { title: "Nature Ambience",  src: "/music/eryliaa-nature-ambience-with-crickets-birds-and-bee-flight-438063.mp3" },
  { title: "Birds & Nature",   src: "/music/freesound_community-ambient-nature-with-birds-75766.mp3" },
];

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function applyAcc(s: AccSettings) {
  if (typeof document === "undefined") return;
  const body = document.body;
  document.documentElement.style.fontSize = s.size === "sm" ? "14px" : s.size === "lg" ? "18px" : "";
  if (s.font === "dyslexic") {
    const id = "opendyslexic-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = "https://fonts.cdnfonts.com/css/opendyslexic";
      document.head.appendChild(link);
    }
    body.style.fontFamily = "'OpenDyslexic', sans-serif";
  } else {
    body.style.fontFamily = "";
  }
  body.classList.toggle("reduce-motion", s.motion === "off");
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-all ${
        active ? "bg-sage text-white border-sage" : "bg-sand text-bark-soft border-sand-mid hover:border-sage"
      }`}>
      {children}
    </button>
  );
}

export function SideDock() {
  const [hovered, setHovered]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [acc, setAcc]           = useState<AccSettings>(DEFAULTS);

  // Music state
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [volume, setVolume]     = useState(0.10);
  const [looping, setLooping]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef                = React.useRef<HTMLAudioElement>(null);
  const isChanging              = React.useRef(false);

  useEffect(() => {
    setMounted(true);
    const saved = getAccSettings();
    setAcc(saved);
    applyAcc(saved);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyAcc(acc);
    localStorage.setItem("ilmio_acc", JSON.stringify(acc));
  }, [acc, mounted]);

  // Music effects
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => {
    if (!audioRef.current || !isChanging.current) return;
    isChanging.current = false;
    audioRef.current.load();
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [current]);
  useEffect(() => { if (audioRef.current) audioRef.current.loop = looping; }, [looping]);
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.10;
    el.play().then(() => setPlaying(true)).catch(() => {
      const fn = () => { el.play().then(() => setPlaying(true)).catch(() => {}); };
      document.addEventListener("click", fn, { once: true });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePlay() {
    const el = audioRef.current; if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(() => {}); setPlaying(true); }
  }
  function go(dir: 1 | -1) {
    isChanging.current = true; setDuration(0); setCurrentTime(0);
    setCurrent(c => (c + dir + PLAYLIST.length) % PLAYLIST.length);
  }
  function handleEnded() {
    if (looping) return;
    isChanging.current = true; setDuration(0); setCurrentTime(0);
    setCurrent(c => (c + 1) % PLAYLIST.length); setPlaying(true);
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current; if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration; setCurrentTime(ratio * duration);
  }

  const track    = PLAYLIST[current];
  const progress = duration > 0 ? currentTime / duration : 0;

  if (!mounted) return null;

  return (
    <>
      <audio ref={audioRef} src={track.src} onEnded={handleEnded}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => { const d = audioRef.current?.duration; if (d && isFinite(d)) setDuration(d); }}
        preload="auto" />

      {/* Side dock */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Collapsed tab — always visible */}
        <div className={`flex flex-col items-center gap-3 bg-parch border border-l-0 border-sand-mid rounded-r-2xl shadow-lg py-4 px-2 transition-all duration-300 ${hovered ? "opacity-0 pointer-events-none w-0 px-0 overflow-hidden" : "opacity-100"}`}>
          <span className="text-bark-faint text-xs" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: "0.1em" }}>A · ♪ · ☀</span>
        </div>

        {/* Expanded panel — appears on hover */}
        <div className={`flex flex-col gap-3 bg-parch border border-l-0 border-sand-mid rounded-r-2xl shadow-2xl p-4 transition-all duration-300 origin-left ${
          hovered ? "opacity-100 scale-x-100 w-72" : "opacity-0 scale-x-0 w-0 overflow-hidden pointer-events-none"
        }`}>

          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-bark-faint uppercase tracking-widest">Controls</p>
            <DarkModeToggle />
          </div>

          {/* ── Music player ── */}
          <div className="bg-sand rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg bg-sage flex items-center justify-center shrink-0 ${playing ? "animate-pulse" : ""}`}>
                <span className="text-white text-xs">♪</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-bark-deep text-xs font-semibold truncate">{track.title}</p>
                <p className="text-bark-faint text-[10px]">{current + 1} / {PLAYLIST.length}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="h-1.5 bg-sand-mid rounded-full cursor-pointer relative overflow-hidden" onClick={seek}>
              <div className="absolute left-0 top-0 h-full bg-sage rounded-full" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-bark-faint">
              <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-1.5">
              <button onClick={() => go(-1)} className="w-7 h-7 rounded-lg bg-parch hover:bg-sand-mid flex items-center justify-center text-bark-deep text-xs transition-colors">⏮</button>
              <button onClick={togglePlay} className="w-9 h-9 rounded-xl bg-sage text-white flex items-center justify-center text-sm hover:opacity-80 transition-opacity">{playing ? "⏸" : "▶"}</button>
              <button onClick={() => go(1)} className="w-7 h-7 rounded-lg bg-parch hover:bg-sand-mid flex items-center justify-center text-bark-deep text-xs transition-colors">⏭</button>
              <button onClick={() => setLooping(l => !l)} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${looping ? "bg-sage text-white" : "bg-parch text-bark-faint hover:bg-sand-mid"}`}>🔁</button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <span className="text-bark-faint text-xs">🔈</span>
              <input type="range" min={0} max={1} step={0.01} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1 h-1.5 accent-sage cursor-pointer" />
              <span className="text-bark-faint text-[10px] w-7 text-right">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* ── Accessibility ── */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold text-bark-faint uppercase tracking-widest">Accessibility</p>

            <div>
              <p className="text-[10px] text-bark-faint mb-1.5">Font</p>
              <div className="flex gap-1.5 flex-wrap">
                <Pill active={acc.font === "default"} onClick={() => setAcc(a => ({...a, font: "default"}))}>Default</Pill>
                <Pill active={acc.font === "dyslexic"} onClick={() => setAcc(a => ({...a, font: "dyslexic"}))}>OpenDyslexic</Pill>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-bark-faint mb-1.5">Text Size</p>
              <div className="flex gap-1.5">
                <Pill active={acc.size === "sm"} onClick={() => setAcc(a => ({...a, size: "sm"}))}>Small</Pill>
                <Pill active={acc.size === "md"} onClick={() => setAcc(a => ({...a, size: "md"}))}>Medium</Pill>
                <Pill active={acc.size === "lg"} onClick={() => setAcc(a => ({...a, size: "lg"}))}>Large</Pill>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-bark-faint mb-1.5">Animations</p>
              <div className="flex gap-1.5">
                <Pill active={acc.motion === "on"} onClick={() => setAcc(a => ({...a, motion: "on"}))}>On</Pill>
                <Pill active={acc.motion === "off"} onClick={() => setAcc(a => ({...a, motion: "off"}))}>Stop all</Pill>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-sand-mid">
              <p className="text-[10px] text-bark-soft font-semibold">Auto-read Ilm replies</p>
              <button onClick={() => setAcc(a => ({...a, autoRead: !a.autoRead}))}
                className={`relative w-10 h-5 rounded-full transition-colors ${acc.autoRead ? "bg-sage" : "bg-sand-mid"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${acc.autoRead ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            <button onClick={() => setAcc(DEFAULTS)} className="w-full text-center text-[10px] text-bark-faint hover:text-bark-deep transition-colors">
              Reset defaults
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
