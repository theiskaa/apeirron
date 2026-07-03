"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The narration player shown on a node page when a published Kokoro MP3 exists.
 * Monochrome by design — it uses the theme's text/background tokens so it reads
 * the same across all four themes. The waveform is the real amplitude of the
 * recording (precomputed peaks + exact duration served as a tiny JSON, so nothing
 * decodes audio in the browser). The audio file isn't fetched until play.
 *
 * While it's playing and the reader has scrolled the inline player out of view,
 * it docks to a fixed pill at the bottom of the screen so playback stays
 * reachable. A placeholder holds the inline space so the article doesn't jump.
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
  const [inlineHeight, setInlineHeight] = useState(0);

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

  // Track whether the inline slot is on screen (accounting for the floating
  // header), so the player can dock to the bottom while playing off-screen.
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

  // Measure the inline height while docked so the placeholder reserves the space.
  useEffect(() => {
    if (!docked && playerRef.current) {
      setInlineHeight(playerRef.current.offsetHeight);
    }
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
  const pMin = Math.min(...peaks);
  const pRange = Math.max(...peaks) - pMin || 1;
  const fraction = duration > 0 ? Math.min(1, current / duration) : 0;
  const litCount = Math.round(fraction * peaks.length);
  const speed = SPEEDS[speedIndex];

  const base =
    "flex items-center gap-2.5 sm:gap-3.5 rounded-full py-1.5 pl-1.5 pr-3 sm:py-2 sm:pl-2 sm:pr-3.5";
  const cls = docked
    ? `${base} fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-xl`
    : `${base} w-full max-w-xl`;

  return (
    <div ref={wrapRef} style={docked ? { minHeight: inlineHeight } : undefined}>
      <div
        ref={playerRef}
        className={cls}
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          ...(docked ? { boxShadow: "var(--chrome-shadow)" } : {}),
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

        {/* Real-amplitude waveform. min-w-0 lets it shrink instead of overflowing
            on narrow screens; the transparent range input handles drag + keyboard. */}
        <div className="relative flex-1 min-w-0 h-6 sm:h-7 flex items-center gap-px sm:gap-[2px]">
          {peaks.map((p, i) => (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                minWidth: 0,
                height: `${(0.14 + 0.86 * ((p - pMin) / pRange)) * 100}%`,
                backgroundColor: "var(--text-primary)",
                opacity: i < litCount ? 0.92 : 0.2,
                transition: "opacity 90ms linear",
              }}
            />
          ))}
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
