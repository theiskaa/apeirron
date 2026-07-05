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
  target?: string | null; // node id a [[wikilink]] points to
  time: number | null;
  asset: string | null;
}
export interface ConnItem {
  label: string;
  color: string;
}
export interface Connections {
  focal: ConnItem;
  targets: Record<string, ConnItem>;
}
export interface Section {
  title: string;
  start: number;
}
export interface Shot {
  time: number;
  kind: string; // person | concept | scene | object | place
  subject: string;
  label: string; // short on-screen caption
  asset: string | null;
}
export interface NumberMomentData {
  value: string;
  unit: string;
  start: number;
  end: number;
}
export const NUMBER_HOLD = 2.8;
export interface NodePlan {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  duration: number;
  sections: Section[];
  cues: Cue[];
  shots: Shot[];
  numbers: NumberMomentData[];
  connections: Connections | null;
  words: Word[];
  peaks: number[];
  // Filename of the narration MP3 inside video/public/, set by generate.mjs.
  audioFile: string | null;
}

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

// A calm parchment field: a slowly panning faint grid and a gently breathing,
// warm page vignette (darkened edges, like an aged sheet). Never fully frozen.
const AmbientBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const gx = (t * 2.4) % 48;
  const gy = (t * 1.2) % 48;
  const vig = 0.1 + 0.05 * Math.sin(t * 0.22);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLORS.grid} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          backgroundPosition: `${gx}px ${gy}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 60%, rgba(43,42,40,${vig}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

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
          color: COLORS.accent,
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
          backgroundColor: COLORS.accent,
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

function activeNumber(plan: NodePlan, sec: number) {
  return plan.numbers.find((n) => sec >= n.start && sec < n.start + NUMBER_HOLD);
}

const NumberMoment: React.FC<{ plan: NodePlan; sec: number }> = ({ plan, sec }) => {
  const active = activeNumber(plan, sec);
  if (!active) return null;
  const since = sec - active.start;
  const fade = interpolate(since, [0, 0.35, NUMBER_HOLD - 0.5, NUMBER_HOLD], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = interpolate(since, [0, 0.5], [16, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fade,
        transform: `translateY(${rise}px)`,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 92,
          fontWeight: 700,
          color: COLORS.accent,
          lineHeight: 1,
        }}
      >
        {active.value}
      </div>
      {active.unit && (
        <div
          style={{
            fontFamily: SANS,
            fontSize: 24,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: COLORS.textMuted,
            marginTop: 16,
          }}
        >
          {active.unit}
        </div>
      )}
    </AbsoluteFill>
  );
};

const ConnectionPanel: React.FC<{
  from: ConnItem;
  to: ConnItem;
  opacity: number;
}> = ({ from, to, opacity }) => (
  <div
    style={{
      position: "absolute",
      right: 96,
      bottom: 210,
      width: 430,
      opacity,
      background: "rgba(26,26,29,0.9)",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16,
      padding: "22px 28px",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        fontFamily: SANS,
        fontSize: 14,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: COLORS.textMuted,
        marginBottom: 18,
      }}
    >
      Connects to
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: from.color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily: SANS, fontSize: 20, color: COLORS.textSecondary }}>
        {from.label}
      </span>
    </div>
    <div
      style={{
        width: 2,
        height: 22,
        marginLeft: 5,
        background: COLORS.border,
      }}
    />
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: to.color,
          boxShadow: `0 0 0 5px ${to.color}33`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: SERIF,
          fontSize: 27,
          fontWeight: 600,
          color: to.color,
          lineHeight: 1.1,
        }}
      >
        {to.label}
      </span>
    </div>
  </div>
);

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
    <span style={{ color: COLORS.accent }}>▸ </span>
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
            color: COLORS.accent,
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
      style={{
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 130px",
      }}
    >
      <div style={{ width: 820 }}>
        {visible.map(({ line, i }) => {
          const dist = Math.abs(i - activeLine);
          const opacity = i === activeLine ? 1 : dist === 1 ? 0.45 : 0.2;
          const focus = i === activeLine;
          return (
            <div
              key={i}
              style={{
                fontFamily: SERIF,
                fontSize: 38,
                lineHeight: 1.55,
                textAlign: "left",
                opacity,
              }}
            >
              {line.words.map(({ text, index }) => {
                const isActive = index === active;
                const spoken = index <= active;
                // Only the focus line gets per-word spoken/upcoming shading; other
                // lines stay a single recessive tone so the eye rests on the focus.
                const color = isActive
                  ? COLORS.accent
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
                      textShadow: isActive ? `0 0 24px ${COLORS.accent}66` : undefined,
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

const SHOT_DUR = 9; // seconds a shot holds on screen

// The shot on screen at `sec` (most recent one with a plate, within its window),
// plus its index (drives which side + camera move) and how long it has been up.
function currentShot(plan: NodePlan, sec: number) {
  const withAsset = plan.shots.filter((s) => s.asset && s.time != null);
  let idx = -1;
  for (let i = 0; i < withAsset.length; i++) {
    if (withAsset[i].time <= sec && sec - withAsset[i].time < SHOT_DUR) idx = i;
  }
  if (idx < 0) return null;
  return { shot: withAsset[idx], index: idx, since: sec - withAsset[idx].time };
}

const shotOpacity = (since: number) =>
  interpolate(since, [0, 0.6, SHOT_DUR - 0.8, SHOT_DUR], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const ShotVisual: React.FC<{
  shot: Shot;
  index: number;
  since: number;
}> = ({ shot, index, since }) => {
  if (!shot.asset) return null;
  const side = "right";
  const opacity = shotOpacity(since);

  // Etch-in: a soft diagonal band sweeps across over ~1.3s so the engraving draws
  // itself in. Composited (intersect) with a permanent bottom fade that dissolves
  // any hallucinated caption/signature band the model baked into the plate.
  const reveal = interpolate(since, [0, 1.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const a = reveal * 128 - 24;
  const mask =
    `linear-gradient(112deg, #000 ${a}%, transparent ${a + 20}%),` +
    `linear-gradient(to bottom, #000 80%, transparent 100%)`;

  // Perpetual camera — a different slow move per shot so none feel identical.
  const variant = index % 3;
  const p = since / SHOT_DUR;
  const scale =
    variant === 0 ? 1.04 + p * 0.09 : variant === 1 ? 1.14 - p * 0.09 : 1.08;
  const tx = variant === 2 ? interpolate(p, [0, 1], [-22, 22]) : 0;
  const ty = interpolate(p, [0, 1], [10, -10]);
  const rot = interpolate(p, [0, 1], [-0.5, 0.5]) * (side === "right" ? 1 : -1);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        [side]: 70,
        transform: "translateY(-50%)",
        width: 820,
        height: 820,
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        maskImage: mask,
        WebkitMaskImage: mask,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    >
      <img
        src={staticFile(shot.asset)}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          transform: `scale(${scale}) translate(${tx}px, ${ty}px) rotate(${rot}deg)`,
          // Antique paper: invert the light-on-transparent plate back to dark ink.
          filter: "invert(1) saturate(0) contrast(1.06)",
          opacity: 0.9,
        }}
      />
    </div>
  );
};

const Body: React.FC<{ plan: NodePlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const cur = currentSection(plan, sec);
  const cardActive = cur != null && cur.sinceStart < SECTION_HOLD;
  // A section interstitial OR a big-number moment recedes the reader so the two
  // never collide; it returns as the overlay fades out.
  const numMoment = activeNumber(plan, sec);
  const dimFor = (since: number, hold: number) =>
    interpolate(since, [0, 0.35, hold - 0.4, hold], [1, 0.12, 0.12, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const readerOpacity = Math.min(
    cardActive ? dimFor(cur!.sinceStart, SECTION_HOLD) : 1,
    numMoment ? dimFor(sec - numMoment.start, NUMBER_HOLD) : 1,
  );

  // When a [[wikilink]] to a connected node is spoken, surface the "Connects to"
  // card lighting up that connection for a few seconds.
  const GLOW = 5;
  const conns = plan.connections;
  const glow =
    conns &&
    plan.cues.find(
      (c) =>
        c.kind === "link" &&
        c.target &&
        conns.targets[c.target] &&
        c.time != null &&
        sec >= c.time &&
        sec < c.time + GLOW,
    );
  const glowOp = glow
    ? interpolate(sec - glow.time!, [0, 0.4, GLOW - 0.6, GLOW], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // The reader lives in a fixed left column and never moves; illustrations arrive
  // on the right. Suppressed while a section card or number moment owns the frame.
  const shotState = !cardActive && !numMoment ? currentShot(plan, sec) : null;

  return (
    <AbsoluteFill>
      {plan.audioFile && <Audio src={staticFile(plan.audioFile)} />}
      <AbsoluteFill style={{ opacity: readerOpacity }}>
        <Karaoke plan={plan} sec={sec} />
      </AbsoluteFill>
      <NumberMoment plan={plan} sec={sec} />
      {shotState && (
        <ShotVisual
          shot={shotState.shot}
          index={shotState.index}
          since={shotState.since}
        />
      )}
      {conns && glow && (
        <ConnectionPanel
          from={conns.focal}
          to={conns.targets[glow.target!]}
          opacity={glowOp}
        />
      )}
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
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ plan: NodePlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", opacity: enter }}
    >
      <BrandText
        size={34}
        color={COLORS.textSecondary}
        style={{ marginBottom: 10 }}
      />
      <div
        style={{
          fontFamily: SANS,
          fontSize: 22,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: COLORS.textMuted,
          marginBottom: 28,
        }}
      >
        Read next
      </div>
      <div
        style={{
          width: 120,
          height: 3,
          backgroundColor: COLORS.accent,
          margin: "28px 0",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 42,
          color: COLORS.textSecondary,
          marginTop: 20,
        }}
      >
        {SITE}
        <span style={{ color: COLORS.accent }}>/node/{plan.id}</span>
      </div>
    </AbsoluteFill>
  );
};

export const NodeVideo: React.FC<NodePlan> = (plan) => {
  const { fps } = useVideoConfig();
  const introFrames = Math.round(INTRO_SECONDS * fps);
  const bodyFrames = Math.round(plan.duration * fps);
  const outroFrames = Math.round(OUTRO_SECONDS * fps);
  const bodyStart = introFrames;

  return (
    <AbsoluteFill>
      <AmbientBackground />
      <Sequence durationInFrames={introFrames}>
        <Intro plan={plan} />
      </Sequence>
      <Sequence from={bodyStart} durationInFrames={bodyFrames}>
        <Body plan={plan} />
      </Sequence>
      <Sequence from={bodyStart + bodyFrames} durationInFrames={outroFrames}>
        <Outro plan={plan} />
      </Sequence>
    </AbsoluteFill>
  );
};
