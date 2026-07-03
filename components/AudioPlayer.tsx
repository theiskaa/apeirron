"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * The narration player shown on a node page when a published Kokoro MP3 exists.
 * Chrome is monochrome (theme text/background tokens) so it reads the same
 * across all four themes; the played portion of the waveform carries the node's
 * category color — the same accent the tabs and follow-mode highlight use.
 * The waveform is the real amplitude of the
 * recording (precomputed peaks + exact duration served as a tiny JSON, so nothing
 * decodes audio in the browser). The audio file isn't fetched until play.
 *
 * Bars render once (memoized) as a dim base + a bright "played" copy revealed by a
 * clip-path, so a time update changes one clip value, not 120 elements.
 *
 * Docking: the inline player NEVER moves (staying in flow avoids reflow), and a
 * second, always-mounted, position:fixed bar simply fades in when the inline one
 * scrolls off during playback. Toggling opacity/transform is compositor-only, so
 * it never interrupts momentum scrolling. Both share one <audio> element + state.
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
  /** Node category color — tints the played portion of the waveform. */
  accent?: string;
  onStart?: () => void;
  /** Hands the shared <audio> element to the parent (for the follow-along mode). */
  onAudioElement?: (el: HTMLAudioElement | null) => void;
  /** When provided, renders the "text follows audio" toggle. */
  onToggleFollow?: () => void;
  follow?: boolean;
  /** Resume point (seconds) — restores the playback position for this node. */
  initialTime?: number;
  /** Reports the current playback time so the position can be persisted. */
  onTime?: (seconds: number) => void;
}

const Bars = memo(function Bars({
  peaks,
  pMin,
  pRange,
  color = "var(--text-primary)",
}: {
  peaks: number[];
  pMin: number;
  pRange: number;
  color?: string;
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
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
});

const BASE =
  "flex items-center gap-2.5 sm:gap-3.5 rounded-full py-1.5 pl-1.5 pr-3 sm:py-2 sm:pl-2 sm:pr-3.5";

export default function AudioPlayer({
  src,
  peaksUrl,
  accent,
  onStart,
  onAudioElement,
  onToggleFollow,
  follow,
  initialTime,
  onTime,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  // Resume point to seek to once the media has metadata (preload="none" means it
  // has none until first play). Consumed on loadedmetadata, then cleared.
  const pendingSeekRef = useRef(initialTime && initialTime > 0 ? initialTime : 0);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState<PeakData | null>(null);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [inlineVisible, setInlineVisible] = useState(true);
  const [box, setBox] = useState({ left: 0, width: 0 });

  // Share the single <audio> element with the parent so the follow-along mode
  // can read its clock and seek it. (Runs after mount, once the ref is set.)
  useEffect(() => {
    onAudioElement?.(audioRef.current);
    return () => onAudioElement?.(null);
  }, [onAudioElement]);

  // Reflect the saved resume point in the UI on mount (waveform fill + time
  // readout), so the reader sees where they left off before pressing play. Done
  // in an effect (not initial state) so server and client first render match.
  useEffect(() => {
    if (initialTime && initialTime > 0) setCurrent(initialTime);
    // AudioPlayer is remounted per node (key={node.id}), so mount-only is right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Is the (never-moving) inline player on screen? Drives the docked bar's fade.
  useEffect(() => {
    const el = inlineRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInlineVisible(entry.isIntersecting),
      { rootMargin: "-100px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The inline player's box → where the docked bar sits (article-aligned).
  useEffect(() => {
    const measure = () => {
      const el = inlineRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ left: r.left, width: r.width });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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
  // Dock the bar whenever the inline player is scrolled off AND audio is engaged
  // (playing OR paused mid-track / resumable). So pausing while scrolled down no
  // longer hides the controls — you can still resume from the docked bar.
  const docked = !inlineVisible && (playing || current > 0);

  // The controls (play + waveform + time + speed), rendered in both the inline
  // player and the docked bar. Both drive the single shared <audio> via audioRef.
  const controls = (
    <>
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

      <div className="relative flex-1 min-w-0 h-6 sm:h-7">
        <div className="absolute inset-0" style={{ opacity: 0.2 }}>
          <Bars peaks={peaks} pMin={pMin} pRange={pRange} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            opacity: accent ? 1 : 0.92,
            clipPath: `inset(0 ${clipRight}% 0 0)`,
            transition: "clip-path 110ms linear",
          }}
        >
          <Bars peaks={peaks} pMin={pMin} pRange={pRange} color={accent} />
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

      {onToggleFollow && (
        <button
          type="button"
          onClick={onToggleFollow}
          aria-label="Follow the narration in the text"
          aria-pressed={follow}
          title={follow ? "Text follows audio: on" : "Text follows audio: off"}
          className="grid place-items-center rounded-full shrink-0 transition-colors"
          style={{
            width: 26,
            height: 26,
            color: follow ? "var(--background)" : "var(--text-muted)",
            backgroundColor: follow ? "var(--text-primary)" : "var(--chrome-fill)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h11M4 12h16M4 17h9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={cycleSpeed}
        aria-label={`Playback speed ${speed}x`}
        className="text-[10px] font-semibold text-text-muted hover:text-text-primary transition-colors rounded-full px-2 py-1 tabular-nums shrink-0 leading-none"
        style={{ backgroundColor: "var(--chrome-fill)" }}
      >
        {speed}×
      </button>
    </>
  );

  const surface = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border-subtle)",
  } as const;

  return (
    <div>
      {/* One audio element, shared by both control sets. */}
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setCurrent(t);
          onTime?.(t);
        }}
        onLoadedMetadata={(e) => {
          // First load after a resume: seek to the saved point (clamped) so
          // pressing play continues from where the reader left off.
          const el = e.currentTarget;
          const seek = pendingSeekRef.current;
          if (seek > 0 && isFinite(el.duration)) {
            el.currentTime = Math.min(seek, el.duration - 0.25);
            pendingSeekRef.current = 0;
          }
        }}
        onDurationChange={(e) => {
          if (!data && isFinite(e.currentTarget.duration)) {
            setData({ duration: e.currentTarget.duration, peaks: [] });
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={(e) => {
          setPlaying(false);
          onTime?.(e.currentTarget.currentTime); // persist immediately on pause
        }}
        onEnded={() => setPlaying(false)}
      />

      {/* Inline player — always in flow, never moves (no reflow on dock). */}
      <div ref={inlineRef} className={`${BASE} w-full max-w-xl`} style={surface}>
        {controls}
      </div>

      {/* Docked bar — always mounted, fixed; only opacity/transform toggle, so it
          never reflows the article or interrupts momentum scrolling. Frosted:
          it floats over article text, so it blurs what passes beneath it. */}
      <div
        aria-hidden={!docked}
        className={`${BASE} fixed z-30`}
        style={{
          ...surface,
          backgroundColor:
            "color-mix(in srgb, var(--surface-elevated) 82%, transparent)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          left: box.left,
          width: box.width,
          maxWidth: "36rem", // == the inline player's max-w-xl; never stretch wider
          bottom: "calc(env(safe-area-inset-bottom) + 1rem)",
          boxShadow: "var(--chrome-shadow)",
          opacity: docked ? 1 : 0,
          transform: docked ? "translateY(0)" : "translateY(12px)",
          pointerEvents: docked ? "auto" : "none",
          transition:
            "opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)",
          willChange: "transform, opacity",
        }}
      >
        {controls}
      </div>
    </div>
  );
}
