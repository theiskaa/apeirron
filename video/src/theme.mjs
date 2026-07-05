// Design tokens for the video, mirrored from the site so the render looks like
// Apeirron rather than a generic template. We hardcode the values (as
// app/node/[id]/opengraph-image.tsx does for its OG image) instead of importing
// the Next app's CSS — the video is an isolated toolchain.
//
// The video always uses the DARK palette (globals.css `.dark`): a lit column of
// text on a near-black field reads far better as motion than the light theme.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// How long the title card holds, the graph "map" beat that follows it, and the
// credits after the narration.
export const INTRO_SECONDS = 3.2;
export const MAP_SECONDS = 4;
export const OUTRO_SECONDS = 5;

export const COLORS = {
  bg: "#1b1b1d", // --background (dark)
  surface: "#232325", // --surface
  border: "#3a3a3a", // --border
  textPrimary: "#dcdcdc", // --text-primary
  textSecondary: "#a0a0b0", // --text-secondary
  textMuted: "#6a6a7a", // --text-muted
  grid: "rgba(255, 255, 255, 0.035)",
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
