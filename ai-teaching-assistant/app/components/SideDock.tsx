"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import {
  type AccSettings,
  DEFAULT_ACC,
  getAccSettings,
  setAccSettings,
  DOCK_MUSIC_PAUSE_EVENT,
  DOCK_MUSIC_RESUME_EVENT,
  ACC_UPDATED_EVENT,
  stopIlmSpeech,
} from "@/lib/accessibility";
import { ILM_DOCK_STOP_MUSIC_EVENT, ILM_OPEN_DOCK_EVENT } from "@/lib/ilm-assistant-actions";

const PANEL_W = 280;
const DOCK_POS_KEY = "ilmio_dock_pos";
const MARGIN = 10;
const TAB_H = 128;

type DockEdge = "left" | "right";
type DockPos = { edge: DockEdge; y: number };

const PLAYLIST = [
  { title: "Relaxing Guitar", src: "/music/freesound_community-simple-relaxing-guitar-loop-60828.mp3" },
  { title: "Forest & River", src: "/music/freesound_community-forest-with-small-river-birds-and-nature-field-recording-6735.mp3" },
  { title: "River in Forest", src: "/music/freesound_community-river-in-the-forest-17271.mp3" },
  { title: "Fire Ambience", src: "/music/soundreality-fire-relaxing-528619.mp3" },
  { title: "Rain Sounds", src: "/music/dragon-studio-copyright-free-rain-sounds-331497.mp3" },
  { title: "British Woods", src: "/music/freesound_community-british-woods-ambient-noise-24942.mp3" },
  { title: "Nature Ambience", src: "/music/eryliaa-nature-ambience-with-crickets-birds-and-bee-flight-438063.mp3" },
  { title: "Birds & Nature", src: "/music/freesound_community-ambient-nature-with-birds-75766.mp3" },
];

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function dockHeight(open: boolean) {
  if (typeof window === "undefined") return open ? 480 : TAB_H;
  return open ? Math.min(540, window.innerHeight * 0.88) : TAB_H;
}

function clampY(y: number, open: boolean) {
  if (typeof window === "undefined") return y;
  const h = dockHeight(open);
  return Math.min(Math.max(MARGIN, y), window.innerHeight - h - MARGIN);
}

function loadDockPos(): DockPos {
  if (typeof window === "undefined") return { edge: "left", y: 120 };
  try {
    const raw = localStorage.getItem(DOCK_POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { edge?: DockEdge; y?: number; x?: number };
      if (p.edge && typeof p.y === "number") {
        return { edge: p.edge, y: clampY(p.y, false) };
      }
      if (typeof p.x === "number" && typeof p.y === "number") {
        return {
          edge: p.x < window.innerWidth / 2 ? "left" : "right",
          y: clampY(p.y, false),
        };
      }
    }
  } catch {
    /* ignore */
  }
  return { edge: "left", y: clampY(Math.round(window.innerHeight * 0.35), false) };
}

function saveDockPos(pos: DockPos) {
  try {
    localStorage.setItem(DOCK_POS_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-all ${
        active ? "bg-sage text-white border-sage" : "bg-sand text-bark-soft border-sand-mid hover:border-sage"
      }`}
    >
      {children}
    </button>
  );
}

function AutoReadSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Auto-read Ilm replies aloud"
      onClick={() => onChange(!on)}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 ${
        on ? "bg-sage" : "bg-sand-mid"
      }`}
    >
      <span
        className={`pointer-events-none absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function SideDock() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DockPos>({ edge: "left", y: 120 });
  const [acc, setAcc] = useState<AccSettings>(DEFAULT_ACC);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.12);
  const [looping, setLooping] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wasPlayingRef = useRef(false);
  const isChanging = useRef(false);

  const posRef = useRef(pos);
  posRef.current = pos;
  const openRef = useRef(open);
  openRef.current = open;

  const dragRef = useRef({
    active: false,
    moved: false,
    offsetY: 0,
    startX: 0,
    startY: 0,
    liveY: 0,
    liveEdge: "left" as DockEdge,
  });

  const patchAcc = useCallback((patch: Partial<AccSettings>) => {
    setAcc((prev) => {
      const next = { ...prev, ...patch };
      setAccSettings(next);
      return next;
    });
  }, []);

  const commitPos = useCallback((edge: DockEdge, y: number, panelOpen: boolean) => {
    const next = { edge, y: clampY(y, panelOpen) };
    setPos(next);
    saveDockPos(next);
  }, []);

  const endDrag = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const d = dragRef.current;
    commitPos(d.liveEdge, d.liveY, openRef.current);
    window.removeEventListener("pointermove", onWinMove);
    window.removeEventListener("pointerup", onWinUp);
  }, [commitPos]);

  const onDragMove = useCallback((clientX: number, clientY: number) => {
    const d = dragRef.current;
    if (!d.active) return;
    if (Math.hypot(clientX - d.startX, clientY - d.startY) > 5) d.moved = true;
    d.liveY = clientY - d.offsetY;
    d.liveEdge = clientX < window.innerWidth / 2 ? "left" : "right";
    setPos({
      edge: d.liveEdge,
      y: clampY(d.liveY, openRef.current),
    });
  }, []);

  const onWinMove = useCallback(
    (e: PointerEvent) => onDragMove(e.clientX, e.clientY),
    [onDragMove]
  );
  const onWinUp = useCallback(() => endDrag(), [endDrag]);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      e.preventDefault();
      const p = posRef.current;
      dragRef.current = {
        active: true,
        moved: false,
        offsetY: e.clientY - p.y,
        startX: e.clientX,
        startY: e.clientY,
        liveY: p.y,
        liveEdge: p.edge,
      };
      window.addEventListener("pointermove", onWinMove);
      window.addEventListener("pointerup", onWinUp);
    },
    [onWinMove, onWinUp]
  );

  const resetPosition = useCallback(() => {
    commitPos("left", Math.round(window.innerHeight * 0.35), openRef.current);
  }, [commitPos]);

  useEffect(() => {
    setMounted(true);
    setPos(loadDockPos());
    setAcc(getAccSettings());
    const onAcc = (e: Event) => {
      const detail = (e as CustomEvent<AccSettings>).detail;
      if (detail) setAcc(detail);
      else setAcc(getAccSettings());
    };
    window.addEventListener(ACC_UPDATED_EVENT, onAcc);
    return () => {
      window.removeEventListener(ACC_UPDATED_EVENT, onAcc);
      window.removeEventListener("pointermove", onWinMove);
      window.removeEventListener("pointerup", onWinUp);
    };
  }, [onWinMove, onWinUp]);

  useEffect(() => {
    if (!mounted) return;
    setPos((p) => ({ ...p, y: clampY(p.y, open) }));
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onResize = () => setPos((p) => ({ ...p, y: clampY(p.y, open) }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted, open]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current || !isChanging.current) return;
    isChanging.current = false;
    audioRef.current.load();
    if (playing) audioRef.current.play().catch(() => setPlaying(false));
  }, [current, playing]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = looping;
  }, [looping]);

  useEffect(() => {
    const pause = () => {
      const el = audioRef.current;
      if (!el) return;
      wasPlayingRef.current = playing && !el.paused;
      el.pause();
      setPlaying(false);
    };
    const resume = () => {
      const el = audioRef.current;
      if (!el || !wasPlayingRef.current) return;
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      wasPlayingRef.current = false;
    };
    const stopMusic = () => {
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
      wasPlayingRef.current = false;
      setPlaying(false);
    };
    const openDock = () => setOpen(true);
    window.addEventListener(DOCK_MUSIC_PAUSE_EVENT, pause);
    window.addEventListener(DOCK_MUSIC_RESUME_EVENT, resume);
    window.addEventListener(ILM_DOCK_STOP_MUSIC_EVENT, stopMusic);
    window.addEventListener(ILM_OPEN_DOCK_EVENT, openDock);
    return () => {
      window.removeEventListener(DOCK_MUSIC_PAUSE_EVENT, pause);
      window.removeEventListener(DOCK_MUSIC_RESUME_EVENT, resume);
      window.removeEventListener(ILM_DOCK_STOP_MUSIC_EVENT, stopMusic);
      window.removeEventListener(ILM_OPEN_DOCK_EVENT, openDock);
    };
  }, [playing]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function go(dir: 1 | -1) {
    isChanging.current = true;
    setCurrentTime(0);
    setCurrent((c) => (c + dir + PLAYLIST.length) % PLAYLIST.length);
  }

  function handleEnded() {
    if (looping) return;
    isChanging.current = true;
    setCurrentTime(0);
    setCurrent((c) => (c + 1) % PLAYLIST.length);
  }

  function onSeekInput(value: number) {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = value * duration;
    setCurrentTime(value * duration);
  }

  const track = PLAYLIST[current];
  const progress = duration > 0 ? currentTime / duration : 0;
  const onLeft = pos.edge === "left";

  if (!mounted) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        onEnded={handleEnded}
        onTimeUpdate={() => {
          if (!seeking) setCurrentTime(audioRef.current?.currentTime ?? 0);
        }}
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration;
          if (d && isFinite(d)) setDuration(d);
        }}
        preload="metadata"
      />

      <div
        className="fixed z-[55] flex items-stretch touch-none select-none"
        style={{
          top: pos.y,
          left: onLeft ? 10 : undefined,
          right: onLeft ? undefined : 10,
        }}
        role="complementary"
        aria-label="Accessibility and focus music"
      >
        {!open ? (
          <button
            type="button"
            onPointerDown={startDrag}
            onClick={() => {
              if (!dragRef.current.moved) setOpen(true);
              dragRef.current.moved = false;
            }}
            className={`flex flex-col items-center justify-center gap-1 w-10 min-h-32 border-2 border-sand-mid bg-parch shadow-lg cursor-grab active:cursor-grabbing hover:border-sage hover:bg-sage-lo/30 transition-colors ${
              onLeft ? "rounded-r-2xl border-l-0" : "rounded-l-2xl border-r-0"
            }`}
            title="Drag up/down · moves to left or right edge · Click to open"
            aria-expanded={false}
          >
            <span className="text-bark-faint text-xs leading-none" aria-hidden>
              ⠿
            </span>
            <span className="text-sage text-sm font-bold" aria-hidden>
              ♿
            </span>
            <span
              className="text-[9px] font-bold text-bark-faint uppercase tracking-wider [writing-mode:vertical-rl] rotate-180"
            >
              Controls
            </span>
            <span className="text-bark-soft text-xs" aria-hidden>
              ♪
            </span>
          </button>
        ) : (
          <div
            className="flex flex-col bg-parch border-2 border-sand-mid shadow-2xl overflow-hidden rounded-2xl"
            style={{ width: PANEL_W, maxHeight: "min(88vh, 540px)" }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5 bg-sand/80 border-b border-sand-mid shrink-0 cursor-grab active:cursor-grabbing"
              onPointerDown={startDrag}
              title="Drag to move along screen edge"
            >
              <span className="text-bark-faint text-sm shrink-0" aria-hidden>
                ⠿
              </span>
              <p className="text-xs font-bold text-bark-faint uppercase tracking-widest flex-1">
                Controls
              </p>
              <div data-no-drag>
                <DarkModeToggle />
              </div>
              <button
                type="button"
                data-no-drag
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-parch text-bark-soft hover:text-bark-deep hover:bg-sand-mid text-sm"
                aria-label="Close controls"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0" data-no-drag>
              <div className="bg-sand rounded-xl p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg bg-sage flex items-center justify-center shrink-0 ${playing ? "animate-pulse" : ""}`}
                  >
                    <span className="text-white text-xs">♪</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-bark-deep text-xs font-semibold truncate">{track.title}</p>
                    <p className="text-bark-faint text-[10px]">
                      {current + 1}/{PLAYLIST.length}
                    </p>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={progress}
                  disabled={!duration}
                  aria-label="Track progress"
                  onPointerDown={() => setSeeking(true)}
                  onPointerUp={() => setSeeking(false)}
                  onChange={(e) => onSeekInput(Number(e.target.value))}
                  className="w-full h-2 accent-sage cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[9px] text-bark-faint -mt-1">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(duration)}</span>
                </div>

                <div className="flex items-center justify-center gap-1.5">
                  <button type="button" onClick={() => go(-1)} className="w-8 h-8 rounded-lg bg-parch hover:bg-sand-mid text-xs">
                    ⏮
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-xl bg-sage text-white flex items-center justify-center text-sm"
                  >
                    {playing ? "⏸" : "▶"}
                  </button>
                  <button type="button" onClick={() => go(1)} className="w-8 h-8 rounded-lg bg-parch hover:bg-sand-mid text-xs">
                    ⏭
                  </button>
                  <button
                    type="button"
                    onClick={() => setLooping((l) => !l)}
                    className={`w-8 h-8 rounded-lg text-xs ${looping ? "bg-sage text-white" : "bg-parch text-bark-faint"}`}
                  >
                    🔁
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-bark-faint text-xs">🔈</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 h-2 accent-sage"
                  />
                  <span className="text-[10px] text-bark-faint w-8 text-right">{Math.round(volume * 100)}%</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-bark-faint uppercase tracking-widest">Accessibility</p>
                <div className="flex gap-1.5 flex-wrap">
                  <Pill active={acc.font === "default"} onClick={() => patchAcc({ font: "default" })}>
                    Default
                  </Pill>
                  <Pill active={acc.font === "dyslexic"} onClick={() => patchAcc({ font: "dyslexic" })}>
                    OpenDyslexic
                  </Pill>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Pill active={acc.size === "sm"} onClick={() => patchAcc({ size: "sm" })}>
                    S
                  </Pill>
                  <Pill active={acc.size === "md"} onClick={() => patchAcc({ size: "md" })}>
                    M
                  </Pill>
                  <Pill active={acc.size === "lg"} onClick={() => patchAcc({ size: "lg" })}>
                    L
                  </Pill>
                </div>
                <div className="flex gap-1.5">
                  <Pill active={acc.motion === "on"} onClick={() => patchAcc({ motion: "on" })}>
                    Motion on
                  </Pill>
                  <Pill active={acc.motion === "off"} onClick={() => patchAcc({ motion: "off" })}>
                    Motion off
                  </Pill>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-sand-mid">
                  <p className="text-[10px] text-bark-soft font-semibold">Auto-read Ilm</p>
                  <AutoReadSwitch
                    on={acc.autoRead}
                    onChange={(v) => {
                      patchAcc({ autoRead: v });
                      if (!v) stopIlmSpeech();
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAccSettings(DEFAULT_ACC);
                    setAcc(DEFAULT_ACC);
                    stopIlmSpeech();
                  }}
                  className="w-full text-center text-[10px] text-bark-faint hover:text-bark-deep py-1"
                >
                  Reset a11y
                </button>
              </div>

              <button
                type="button"
                onClick={resetPosition}
                className="w-full text-center text-[10px] text-sage-hi font-semibold hover:underline py-1"
              >
                Reset position (left side)
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
