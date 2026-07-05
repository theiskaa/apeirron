import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";
import {
  COLORS,
  INTRO_SECONDS,
  OUTRO_SECONDS,
  CATEGORY_LABELS,
  SITE,
} from "./theme.mjs";
const fmtClock = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

// The Apeirron brand as it appears in the site navbar: the word set in the serif
// (Playfair Display) at weight 700 with a hair of negative tracking — no logo mark.
const BrandText: React.FC<{
  size: number;
  color: string;
  style?: React.CSSProperties;
}> = ({ size, color, style }) => (
  <div
    style={{
      fontFamily: SERIF,
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1,
      fontSize: size,
      color,
      ...style,
    }}
  >
    Apeirron
  </div>
);

// Limit to the weights/subset actually used — otherwise google-fonts fetches
// every weight and script on each render (100+ requests, much slower).
const FONT_OPTS = {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
} as const;
const { fontFamily: SERIF } = loadSerif("normal", FONT_OPTS);
const { fontFamily: SANS } = loadSans("normal", FONT_OPTS);

export type Word = [string, number, number]; // [text, start, end]
export interface Cue {
  term: string;
  kind: string;
  time: number | null;
  asset: string | null;
}
export interface Section {
  title: string;
  start: number;
}
export interface NodePlan {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  duration: number;
  sections: Section[];
  cues: Cue[];
  words: Word[];
  peaks: number[];
  // Filename of the narration MP3 inside video/public/, set by generate.mjs.
  audioFile: string | null;
}

// ── helpers ────────────────────────────────────────────────────────────────

// Index of the word being spoken at `sec` (the last word that has started).
function activeWordIndex(words: Word[], sec: number): number {
  let lo = 0;
  let hi = words.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid][1] <= sec) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

interface Line {
  words: { text: string; index: number }[];
}

// Break the spoken words into readable lines (~46 chars), preferring to break
// right after sentence punctuation so lines land on natural phrase boundaries.
function buildLines(words: Word[]): Line[] {
  const lines: Line[] = [];
  let cur: Line = { words: [] };
  let len = 0;
  words.forEach(([text], index) => {
    cur.words.push({ text, index });
    len += text.length + 1;
    const endsSentence = /[.!?]$/.test(text);
    if (len >= 46 || (endsSentence && len >= 26)) {
      lines.push(cur);
      cur = { words: [] };
      len = 0;
    }
  });
  if (cur.words.length) lines.push(cur);
  return lines;
}

// ── background ───────────────────────────────────────────────────────────────

const GridBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: COLORS.bg,
      backgroundImage: `linear-gradient(${COLORS.grid} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
      backgroundSize: "48px 48px",
    }}
  />
);

// ── intro card ───────────────────────────────────────────────────────────────

const Intro: React.FC<{ plan: NodePlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const exit = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const y = interpolate(enter, [0, 1], [24, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 160px",
        opacity: Math.min(enter, exit),
        transform: `translateY(${y}px)`,
      }}
    >
      <BrandText size={32} color={COLORS.textSecondary} style={{ marginBottom: 52 }} />
      <div
        style={{
          fontFamily: SANS,
          fontSize: 26,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: plan.color,
          fontWeight: 600,
          marginBottom: 28,
        }}
      >
        {CATEGORY_LABELS[plan.category as keyof typeof CATEGORY_LABELS] ||
          plan.category}
      </div>
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 104,
          lineHeight: 1.05,
          color: COLORS.textPrimary,
          textAlign: "center",
          margin: 0,
          fontWeight: 600,
          maxWidth: 1400,
        }}
      >
        {plan.title}
      </h1>
      <div
        style={{
          width: 120,
          height: 3,
          backgroundColor: plan.color,
          margin: "44px 0",
          borderRadius: 2,
        }}
      />
      <p
        style={{
          fontFamily: SANS,
          fontSize: 32,
          lineHeight: 1.5,
          color: COLORS.textSecondary,
          textAlign: "center",
          margin: 0,
          maxWidth: 1120,
        }}
      >
        {plan.description}
      </p>
    </AbsoluteFill>
  );
};

// ── section card (transient banner on each section change) ───────────────────

// How long a section's full-screen interstitial holds before it collapses to the
// persistent top-left kicker. Exported so the body can dim the reader in step.
export const SECTION_HOLD = 2.8;

// Resolve the section active at `sec` and how long it has been on screen.
function currentSection(plan: NodePlan, sec: number) {
  const idx = plan.sections.filter((s) => s.start <= sec).length - 1;
  if (idx < 0) return null;
  return { section: plan.sections[idx], sinceStart: sec - plan.sections[idx].start };
}

const SectionKicker: React.FC<{ plan: NodePlan; title: string }> = ({
  plan,
  title,
}) => (
  <div
    style={{
      position: "absolute",
      top: 72,
      left: 140,
      fontFamily: SANS,
      fontSize: 22,
      letterSpacing: 3,
      textTransform: "uppercase",
      color: COLORS.textMuted,
      fontWeight: 600,
    }}
  >
    <span style={{ color: plan.color }}>▸ </span>
    {title}
  </div>
);

const SectionCard: React.FC<{
  plan: NodePlan;
  section: Section;
  sinceStart: number;
}> = ({ plan, section, sinceStart }) => {
  const { fps } = useVideoConfig();
  const localFrame = sinceStart * fps;
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200 },
    durationInFrames: 18,
  });
  const fade = interpolate(
    sinceStart,
    [0, 0.4, SECTION_HOLD - 0.4, SECTION_HOLD],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: fade,
          transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: 20,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: plan.color,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {plan.title}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 72,
            color: COLORS.textPrimary,
            fontWeight: 600,
            maxWidth: 1400,
          }}
        >
          {section.title}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── karaoke reader ───────────────────────────────────────────────────────────

const WINDOW = 2; // lines shown above/below the current one

const Karaoke: React.FC<{ plan: NodePlan; sec: number }> = ({ plan, sec }) => {
  const lines = useMemo(() => buildLines(plan.words), [plan.words]);
  const active = activeWordIndex(plan.words, sec);

  // The focus line is the one CONTAINING the active word (first line whose last
  // word index reaches it) — not the last fully-spoken line.
  let activeLine = lines.length - 1;
  for (let i = 0; i < lines.length; i++) {
    const last = lines[i].words[lines[i].words.length - 1];
    if (last && last.index >= active) {
      activeLine = i;
      break;
    }
  }

  const from = Math.max(0, activeLine - WINDOW);
  const to = Math.min(lines.length - 1, activeLine + WINDOW);
  const visible = [];
  for (let i = from; i <= to; i++) visible.push({ line: lines[i], i });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: "0 260px" }}
    >
      <div style={{ maxWidth: 1400, width: "100%" }}>
        {visible.map(({ line, i }) => {
          const dist = Math.abs(i - activeLine);
          const opacity = i === activeLine ? 1 : dist === 1 ? 0.45 : 0.2;
          const focus = i === activeLine;
          return (
            <div
              key={i}
              style={{
                fontFamily: SERIF,
                fontSize: 46,
                lineHeight: 1.55,
                textAlign: "center",
                opacity,
              }}
            >
              {line.words.map(({ text, index }) => {
                const isActive = index === active;
                const spoken = index <= active;
                // Only the focus line gets per-word spoken/upcoming shading; other
                // lines stay a single recessive tone so the eye rests on the focus.
                const color = isActive
                  ? plan.color
                  : focus
                    ? spoken
                      ? COLORS.textPrimary
                      : COLORS.textMuted
                    : spoken
                      ? COLORS.textSecondary
                      : COLORS.textMuted;
                return (
                  <span
                    key={index}
                    style={{
                      color,
                      // Glow instead of bold weight — emphasis without reflow
                      // (a bolder active word would re-center the line each tick).
                      textShadow: isActive ? `0 0 24px ${plan.color}66` : undefined,
                    }}
                  >
                    {text}{" "}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── waveform + progress (bottom strip) ───────────────────────────────────────

const Waveform: React.FC<{ plan: NodePlan; sec: number }> = ({ plan, sec }) => {
  const peaks = plan.peaks.length ? plan.peaks : new Array(120).fill(0.15);
  const progress = plan.duration ? sec / plan.duration : 0;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 66,
        left: 260,
        right: 260,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ height: 54, display: "flex", alignItems: "center", gap: 3 }}>
        {peaks.map((p, i) => {
          const played = i / peaks.length <= progress;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(3, p * 100)}%`,
                backgroundColor: played ? plan.color : COLORS.border,
                borderRadius: 2,
                opacity: played ? 0.9 : 0.5,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: SANS,
          fontSize: 20,
          fontVariantNumeric: "tabular-nums",
          color: COLORS.textMuted,
        }}
      >
        <span style={{ color: plan.color }}>{fmtClock(sec)}</span>
        <span>{fmtClock(plan.duration)}</span>
      </div>
    </div>
  );
};

// ── cued visual slot (inert until cues carry assets) ─────────────────────────

const CueVisual: React.FC<{ plan: NodePlan; sec: number }> = ({ plan, sec }) => {
  const withAsset = plan.cues.filter((c) => c.asset && c.time != null);
  // Most recent cue whose asset is on screen (shown for 6s after it is named).
  const current = withAsset
    .filter((c) => c.time! <= sec && sec - c.time! < 6)
    .pop();
  if (!current || !current.asset) return null;
  const local = sec - current.time!;
  const opacity = interpolate(local, [0, 0.4, 5.4, 6], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        right: 90,
        top: "50%",
        transform: "translateY(-50%)",
        opacity,
        width: 360,
        height: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={staticFile(current.asset)}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  );
};

// ── body ─────────────────────────────────────────────────────────────────────

const Body: React.FC<{ plan: NodePlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const cur = currentSection(plan, sec);
  const cardActive = cur != null && cur.sinceStart < SECTION_HOLD;
  // While a section interstitial holds, recede the reader so the two never
  // collide; it returns as the card fades out.
  const readerOpacity = cardActive
    ? interpolate(
        cur!.sinceStart,
        [0, 0.35, SECTION_HOLD - 0.4, SECTION_HOLD],
        [1, 0.1, 0.1, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 1;

  return (
    <AbsoluteFill>
      {plan.audioFile && <Audio src={staticFile(plan.audioFile)} />}
      <AbsoluteFill style={{ opacity: readerOpacity }}>
        <Karaoke plan={plan} sec={sec} />
      </AbsoluteFill>
      <CueVisual plan={plan} sec={sec} />
      {/* persistent brand mark, top-right — balances the section kicker at top-left */}
      <BrandText
        size={24}
        color={COLORS.textMuted}
        style={{ position: "absolute", top: 66, right: 140, opacity: 0.7 }}
      />
      {cur &&
        (cardActive ? (
          <SectionCard plan={plan} section={cur.section} sinceStart={cur.sinceStart} />
        ) : (
          <SectionKicker plan={plan} title={cur.section.title} />
        ))}
      <Waveform plan={plan} sec={sec} />
    </AbsoluteFill>
  );
};

// ── outro ────────────────────────────────────────────────────────────────────

const Outro: React.FC<{ plan: NodePlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const y = interpolate(enter, [0, 1], [24, 0]);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: enter,
        transform: `translateY(${y}px)`,
      }}
    >
      <BrandText size={84} color={COLORS.textPrimary} />
      <div
        style={{
          width: 120,
          height: 3,
          backgroundColor: plan.color,
          margin: "40px 0",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          fontFamily: SANS,
          fontSize: 26,
          letterSpacing: 2,
          color: COLORS.textMuted,
          marginBottom: 20,
        }}
      >
        Read the full node
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 46,
          color: COLORS.textSecondary,
        }}
      >
        {SITE}
        <span style={{ color: plan.color }}>/node/{plan.id}</span>
      </div>
    </AbsoluteFill>
  );
};

// ── composition ──────────────────────────────────────────────────────────────

export const NodeVideo: React.FC<NodePlan> = (plan) => {
  const { fps } = useVideoConfig();
  const introFrames = Math.round(INTRO_SECONDS * fps);
  const bodyFrames = Math.round(plan.duration * fps);
  const outroFrames = Math.round(OUTRO_SECONDS * fps);

  return (
    <AbsoluteFill>
      <GridBackground />
      <Sequence durationInFrames={introFrames}>
        <Intro plan={plan} />
      </Sequence>
      <Sequence from={introFrames} durationInFrames={bodyFrames}>
        <Body plan={plan} />
      </Sequence>
      <Sequence from={introFrames + bodyFrames} durationInFrames={outroFrames}>
        <Outro plan={plan} />
      </Sequence>
    </AbsoluteFill>
  );
};
