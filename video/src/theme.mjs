// Design tokens for the video, mirrored from the site so the render looks like
// Apeirron rather than a generic template. We hardcode the values (as
// app/node/[id]/opengraph-image.tsx does for its OG image) instead of importing
// the Next app's CSS — the video is an isolated toolchain.
//
// Light "reader" palette, mirrored from reeed-web (app/globals.css): near-black
// ink on warm off-white paper, blue accent, yellow highlight marker.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// How long the title card holds and the credits after the narration.
export const INTRO_SECONDS = 3.2;
export const OUTRO_SECONDS = 5;

export const COLORS = {
  bg: "#f1efec", // --paper
  surface: "#faf9f7", // --surface
  border: "#e2dfda", // --line
  textPrimary: "#2b2a28", // --ink
  textSecondary: "#6f6c66", // --ink-soft
  textMuted: "#a8a49c", // lighter ink-soft
  grid: "rgba(43, 42, 40, 0.04)",
  accent: "#3b82f6", // --accent (blue)
  highlight: "#ffe59e", // --highlight (yellow marker)
};

// Human labels for the category kicker on the intro card. The accent COLOR is not
// duplicated here — it comes per-node from lib/generated/graph-metadata.json
// (categories[].color) via the scene plan's `color`, the single source of truth.
export const CATEGORY_LABELS = {
  mind: "Mind",
  origins: "Origins",
  cosmos: "Cosmos",
  power: "Power",
  operations: "Operations",
  modern: "Modern",
  reality: "Reality",
};

export const SITE = "apeirron.com";
