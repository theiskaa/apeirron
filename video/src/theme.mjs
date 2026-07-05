// Design tokens for the shorts, mirrored from the site so the render looks like
// Apeirron rather than a generic template. We hardcode the values (as
// app/node/[id]/opengraph-image.tsx does for its OG image) instead of importing
// the Next app's CSS — the video is an isolated toolchain.
//
// Light "reader" palette, mirrored from reeed-web (app/globals.css): near-black
// ink on warm off-white paper, blue accent.

export const COLORS = {
  bg: "#f1efec", // --paper
  textPrimary: "#2b2a28", // --ink
  textSecondary: "#6f6c66", // --ink-soft
  textMuted: "#a8a49c", // lighter ink-soft
  accent: "#3b82f6", // --accent (blue)
};

export const SITE = "apeirron.com";
