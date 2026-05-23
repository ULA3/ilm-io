"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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

const INIT_VOLUME = 0.10;

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const [expanded, setExpanded]     = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [looping, setLooping]       = useState(false);
  const [current, setCurrent]       = useState(0);
  const [volume, setVolume]         = useState(INIT_VOLUME);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const audioRef                    = useRef<HTMLAudioElement>(null);
  const isChanging                  = useRef(false);

  // Autoplay at 10% on mount; if browser blocks, start on first user interaction
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = INIT_VOLUME;
    el.play()
      .then(() => setPlaying(true))
      .catch(() => {
        const onInteract = () => {
          el.play().then(() => setPlaying(true)).catch(() => {});
        };
        document.addEventListener("click", onInteract, { once: true });
        document.addEventListener("keydown", onInteract, { once: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // When track changes, load and play
  useEffect(() => {
    if (!audioRef.current || !isChanging.current) return;
    isChanging.current = false;
    audioRef.current.load();
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync loop flag to audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = looping;
  }, [looping]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(() => {}); setPlaying(true); }
  }

  const go = useCallback((dir: 1 | -1) => {
    isChanging.current = true;
    setDuration(0);
    setCurrentTime(0);
    setCurrent(c => (c + dir + PLAYLIST.length) % PLAYLIST.length);
  }, []);

  function handleEnded() {
    if (looping) return; // audio element handles loop natively
    isChanging.current = true;
    setDuration(0);
    setCurrentTime(0);
    setCurrent(c => (c + 1) % PLAYLIST.length);
    setPlaying(true);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }

  const track = PLAYLIST[current];
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="fixed bottom-5 left-34 z-50 flex flex-col items-start gap-2">
      <audio
        ref={audioRef}
        src={track.src}
        onEnded={handleEnded}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration;
          if (d && isFinite(d)) setDuration(d);
        }}
        onDurationChange={() => {
          const d = audioRef.current?.duration;
          if (d && isFinite(d)) setDuration(d);
        }}
        preload="auto"
      />

      {expanded && (
        <div className="bg-parch border border-sand-mid rounded-2xl shadow-xl p-4 w-64 animate-fade-up absolute bottom-14 left-0">

          {/* Track name */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-lg bg-sage flex items-center justify-center shrink-0 ${playing ? "animate-pulse" : ""}`}>
              <span className="text-white text-xs">♪</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-bark-deep text-xs font-semibold truncate">{track.title}</p>
              <p className="text-bark-faint text-[10px]">{current + 1} / {PLAYLIST.length}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-1">
            <div
              className="h-1.5 bg-sand rounded-full cursor-pointer relative overflow-hidden"
              onClick={seek}
            >
              <div
                className="absolute left-0 top-0 h-full bg-sage rounded-full transition-none"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-bark-faint text-[10px]">{fmt(currentTime)}</span>
              <span className="text-bark-faint text-[10px]">{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <button onClick={() => go(-1)}
              className="w-8 h-8 rounded-xl bg-sand hover:bg-sand-mid flex items-center justify-center text-bark-deep transition-colors text-sm">
              ⏮
            </button>
            <button onClick={togglePlay}
              className="w-10 h-10 rounded-xl bg-sage text-white flex items-center justify-center hover:bg-sage-hi transition-colors text-base shadow-sm">
              {playing ? "⏸" : "▶"}
            </button>
            <button onClick={() => go(1)}
              className="w-8 h-8 rounded-xl bg-sand hover:bg-sand-mid flex items-center justify-center text-bark-deep transition-colors text-sm">
              ⏭
            </button>
            <button
              onClick={() => setLooping(l => !l)}
              title={looping ? "Loop on" : "Loop off"}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors ${
                looping ? "bg-sage text-white" : "bg-sand text-bark-faint hover:bg-sand-mid hover:text-bark-deep"
              }`}
            >
              🔁
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="text-bark-faint text-xs shrink-0">🔈</span>
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1 h-1.5 accent-sage cursor-pointer"
            />
            <span className="text-bark-faint text-[10px] w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setExpanded(o => !o)}
        aria-label="Music player"
        className={`w-11 h-11 rounded-2xl shadow-lg flex items-center justify-center text-lg transition-all ${
          playing
            ? "bg-sage text-white hover:bg-sage-hi"
            : "bg-parch border border-sand-mid text-bark-soft hover:text-bark-deep hover:border-bark-faint"
        }`}
      >
        {playing ? "🎵" : "🎶"}
      </button>
    </div>
  );
}
