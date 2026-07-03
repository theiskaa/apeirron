"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * The narration player shown on a node page when a published Kokoro MP3 exists.
 * Monochrome by design — it uses the theme's text/background tokens so it reads
 * the same across all four themes. The waveform is the real amplitude of the
 * recording (precomputed peaks + exact duration served as a tiny JSON, so nothing
 * decodes audio in the browser). The audio file isn't fetched until play.
 *
 * The bars are rendered once (memoized) as two stacked layers — a dim base and a
 * bright "played" copy revealed by a clip-path — so a time update only changes one
 * clip value, never 120 elements. That keeps scrolling-while-playing smooth.
 *
 * While playing and scrolled out of view, the player docks to a fixed pill pinned
 * to the bottom, kept at the article's horizontal position (measured), not the
 * viewport center. A placeholder holds the inline space so the article doesn't jump.
 */

const SPEEDS = [1, 1.25, 1.5, 2];
const PLACEHOLDER = Array.from({ length: 120 }, () => 0.4);

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface PeakData {
  duration: number;
  peaks: number[];
}

interface Props {
  src: string;
  peaksUrl: string;
  onStart?: () => void;
}

// The waveform bars themselves — memoized so time updates never re-render them.
const Bars = memo(function Bars({
  peaks,
  pMin,
  pRange,
}: {
  peaks: number[];
  pMin: number;
  pRange: number;
}) {
  return (
    <div className="flex items-center gap-px sm:gap-[2px] w-full h-full">
      {peaks.map((p, i) => (
        <div
          key={i}
          className="flex-1 rounded-full"
          style={{
            minWidth: 0,
            height: `${(0.14 + 0.86 * ((p - pMin) / pRange)) * 100}%`,
            backgroundColor: "var(--text-primary)",
          }}
        />
      ))}
    </div>
  );
});

export default function AudioPlayer({ src, peaksUrl, onStart }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState<PeakData | null>(null);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [inlineVisible, setInlineVisible] = useState(true);
  const [box, setBox] = useState({ left: 0, width: 0, height: 0 });
  const [dockAnim, setDockAnim] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(peaksUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: PeakData) => alive && setData(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [peaksUrl]);

  // Is the inline slot on screen (accounting for the floating header)?
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInlineVisible(entry.isIntersecting),
      { rootMargin: "-116px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const docked = playing && !inlineVisible;

  // Measure the inline slot's box so the docked pill can sit at the article's
  // horizontal position (not centered) and the placeholder can reserve height.
  useEffect(() => {
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({
        left: r.left,
        width: r.width,
        height: playerRef.current?.offsetHeight ?? r.height,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Slide/fade the docked pill in on the frame after it mounts.
  useEffect(() => {
    if (!docked) {
      setDockAnim(false);
      return;
    }
    const id = requestAnimationFrame(() => setDockAnim(true));
    return () => cancelAnimationFrame(id);
  }, [docked]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      if (!startedRef.current) {
        startedRef.current = true;
        onStart?.();
      }
      void el.play();
    } else {
      el.pause();
    }
  }, [onStart]);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((i) => {
      const next = (i + 1) % SPEEDS.length;
      if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
      return next;
    });
  }, []);

  const peaks = data?.peaks?.length ? data.peaks : PLACEHOLDER;
  const duration = data?.duration || 0;
  const { pMin, pRange } = useMemo(() => {
    const min = Math.min(...peaks);
    return { pMin: min, pRange: Math.max(...peaks) - min || 1 };
  }, [peaks]);
  const fraction = duration > 0 ? Math.min(1, current / duration) : 0;
  const clipRight = ((1 - fraction) * 100).toFixed(2);
  const speed = SPEEDS[speedIndex];

  const base =
    "flex items-center gap-2.5 sm:gap-3.5 rounded-full py-1.5 pl-1.5 pr-3 sm:py-2 sm:pl-2 sm:pr-3.5";
  const cls = docked ? `${base} fixed z-30` : `${base} w-full max-w-xl`;

  return (
    <div ref={wrapRef} style={docked ? { minHeight: box.height } : undefined}>
      <div
        ref={playerRef}
        className={cls}
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          ...(docked
            ? {
                left: box.left,
                width: box.width,
                bottom: "calc(env(safe-area-inset-bottom) + 1rem)",
                boxShadow: "var(--chrome-shadow)",
                willChange: "transform",
                opacity: dockAnim ? 1 : 0,
                transform: dockAnim ? "translateY(0)" : "translateY(8px)",
                transition:
                  "transform var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out)",
              }
            : {}),
        }}
      >
        <audio
          ref={audioRef}
          src={src}
          preload="none"
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onDurationChange={(e) => {
            if (!data && isFinite(e.currentTarget.duration)) {
              setData({ duration: e.currentTarget.duration, peaks: [] });
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause narration" : "Play narration"}
          className="grid place-items-center rounded-full shrink-0 transition-transform active:scale-95"
          style={{
            width: 34,
            height: 34,
            backgroundColor: "var(--text-primary)",
            color: "var(--background)",
          }}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4.4" height="14" rx="1.3" />
              <rect x="13.6" y="5" width="4.4" height="14" rx="1.3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.29-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
            </svg>
          )}
        </button>

        {/* Waveform: dim base + bright played copy revealed by clip-path. */}
        <div className="relative flex-1 min-w-0 h-6 sm:h-7">
          <div className="absolute inset-0" style={{ opacity: 0.2 }}>
            <Bars peaks={peaks} pMin={pMin} pRange={pRange} />
          </div>
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.92,
              clipPath: `inset(0 ${clipRight}% 0 0)`,
              transition: "clip-path 110ms linear",
            }}
          >
            <Bars peaks={peaks} pMin={pMin} pRange={pRange} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="any"
            value={current}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = v;
              setCurrent(v);
            }}
            aria-label="Seek"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <span className="text-[10px] sm:text-[11px] text-text-muted tabular-nums shrink-0">
          {formatTime(current)} / {formatTime(duration)}
        </span>

        <button
          type="button"
          onClick={cycleSpeed}
          aria-label={`Playback speed ${speed}x`}
          className="text-[10px] font-semibold text-text-muted hover:text-text-primary transition-colors rounded-full px-2 py-1 tabular-nums shrink-0 leading-none"
          style={{ backgroundColor: "var(--chrome-fill)" }}
        >
          {speed}×
        </button>
      </div>
    </div>
  );
}
