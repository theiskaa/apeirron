import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";
import { THEMES, SITE } from "./theme.mjs";

type Theme = (typeof THEMES)[keyof typeof THEMES];

const FONT_OPTS = {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
} as const;
const { fontFamily: SERIF } = loadSerif("normal", FONT_OPTS);
const { fontFamily: SANS } = loadSans("normal", FONT_OPTS);

export type Word = [string, number, number]; // [text, start, end]
export interface ShortImage {
  time: number;
  asset: string | null;
}
export interface ShortPlan {
  id: string;
  slug: string;
  title: string;
  duration: number;
  words: Word[];
  images: ShortImage[];
  audioFile: string | null;
  style?: keyof typeof THEMES; // image look + caption palette; default ink
  palette?: Partial<Theme>; // per-short colors auto-extracted from the imagery
}

function activeWordIndex(words: Word[], sec: number): number {
  let lo = 0,
    hi = words.length - 1,
    ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid][1] <= sec) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

interface Chunk {
  words: { text: string; index: number }[];
  start: number;
}
function buildChunks(words: Word[]): Chunk[] {
  const chunks: Chunk[] = [];
  let cur: Chunk["words"] = [];
  let len = 0;
  const flush = () => {
    if (!cur.length) return;
    chunks.push({ words: cur, start: words[cur[0].index][1] });
    cur = [];
    len = 0;
  };
  words.forEach(([text], index) => {
    cur.push({ text, index });
    len += text.length + 1;
    if (cur.length >= 3 || len >= 22 || /[.!?,;:]$/.test(text)) flush();
  });
  flush();
  return chunks;
}

const FADE = 0.5; // crossfade seconds
// Slow ken-burns scale from an image's own start.
const kenBurns = (t: number) => 1.06 + (Math.min(t, 8) / 8) * 0.1;

// Crossfade the current image OVER the previous one. Only two layers ever render,
// both via Remotion's <Img> (which blocks the frame until the image is decoded, so
// no flicker/lag), so switching is smooth and the paper never shows through.
const ImagePanel: React.FC<{ plan: ShortPlan; sec: number; theme: Theme }> = ({ plan, sec, theme }) => {
  const imgs = plan.images.filter((i) => i.asset);
  const panel: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1080,
    height: 1920,
    overflow: "hidden",
    backgroundColor: theme.bg,
  };
  const cover: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };
  if (!imgs.length) return <div style={panel} />;

  let idx = 0;
  for (let i = 0; i < imgs.length; i++) if (imgs[i].time <= sec) idx = i;
  const cur = imgs[idx];
  const prev = idx > 0 ? imgs[idx - 1] : null;
  const since = sec - cur.time;
  const curOp = interpolate(since, [0, FADE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={panel}>
      {prev && since < FADE && (
        <Img
          src={staticFile(prev.asset!)}
          style={{ ...cover, transform: `scale(${kenBurns(sec - prev.time)})` }}
        />
      )}
      <Img
        src={staticFile(cur.asset!)}
        style={{ ...cover, opacity: curOp, transform: `scale(${kenBurns(since)})` }}
      />
    </div>
  );
};

const Captions: React.FC<{ plan: ShortPlan; sec: number; theme: Theme }> = ({ plan, sec, theme }) => {
  const chunks = useMemo(() => buildChunks(plan.words), [plan.words]);
  const active = activeWordIndex(plan.words, sec);
  let ci = chunks.findIndex((c) => c.words.some((w) => w.index === active));
  if (ci < 0) ci = chunks.findIndex((c) => c.words[0].index > active);
  if (ci < 0) ci = chunks.length - 1;
  const chunk = chunks[ci];
  if (!chunk) return null;

  const since = sec - chunk.start;
  const pop = spring({ frame: since * 30, fps: 30, config: { damping: 140 }, durationInFrames: 8 });

  return (
    // Lyrics live in the vertical center of the frame. A soft full-width band
    // sits behind them so they stay legible over any image, bright or dark.
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 90px",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          height: 620,
          background: `linear-gradient(to bottom, transparent 0%, ${theme.scrim} 30%, ${theme.scrim} 70%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          transform: `translateY(${interpolate(pop, [0, 1], [18, 0])}px)`,
          opacity: pop,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 1.18,
          letterSpacing: "-0.01em",
          textShadow: theme.textShadow,
        }}
      >
        {chunk.words.map(({ text, index }) => {
          const isActive = index === active;
          const spoken = index <= active;
          return (
            <span
              key={index}
              style={{
                color: isActive ? theme.accent : spoken ? theme.spoken : theme.unspoken,
              }}
            >
              {text}{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const EndCard: React.FC<{ plan: ShortPlan; enter: number; theme: Theme }> = ({ plan, enter, theme }) => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      opacity: enter,
      padding: "0 100px",
      textAlign: "center",
      backgroundColor: theme.bg,
    }}
  >
    <div
      style={{
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: 88,
        color: theme.endTitle,
        lineHeight: 1.1,
        marginBottom: 34,
      }}
    >
      {plan.title}
    </div>
    <div style={{ fontFamily: SANS, fontSize: 42, color: theme.endSub }}>
      full story at{" "}
      <span style={{ color: theme.accent, fontWeight: 700 }}>{SITE}</span>
    </div>
  </AbsoluteFill>
);

export const ShortVideo: React.FC<ShortPlan> = (plan) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const endStart = plan.duration + 0.15;
  const onEnd = sec >= endStart;
  const endEnter = spring({
    frame: (sec - endStart) * fps,
    fps,
    config: { damping: 200 },
    durationInFrames: 18,
  });

  const base = THEMES[plan.style ?? "ink"] ?? THEMES.ink;
  // Auto-extracted per-short colors override the base theme when present.
  const theme = { ...base, ...(plan.palette ?? {}) };

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {plan.audioFile && <Audio src={staticFile(plan.audioFile)} />}
      {onEnd ? (
        <EndCard plan={plan} enter={endEnter} theme={theme} />
      ) : (
        <>
          <ImagePanel plan={plan} sec={sec} theme={theme} />
          <Captions plan={plan} sec={sec} theme={theme} />
        </>
      )}
    </AbsoluteFill>
  );
};
