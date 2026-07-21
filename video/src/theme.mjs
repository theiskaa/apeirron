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

// Per-image-style render palettes — one key per style in image.py's STYLES.
// `--style` in shorts.mjs sets plan.style and the composition picks the matching
// entry. `engraving` is the mono ink on cream paper (mirrors the site) and is
// the only light one; the rest sit under dark, graded plates, so their scrim and
// captions go light-on-dark. `painterly` is additionally overridden per short by
// palette.py, which pulls the accent out of the generated imagery.
export const THEMES = {
  // Signature brand look: crimson + black. Gold active word pops on the red/black.
  ink: {
    bg: "#120607", // stage color behind the image during crossfades
    spoken: "#f6efe9", // already-narrated caption words
    unspoken: "#b0857e", // upcoming words
    accent: "#ffd24a", // the word being spoken + the URL
    // soft band behind the centered lyrics, + a shadow for legibility
    scrim: "rgba(9,3,4,0.55)",
    textShadow: "0 4px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6)",
    endTitle: "#f8f1eb",
    endSub: "#d8a29a",
  },
  noir: {
    bg: "#0a0a0a",
    spoken: "#f5f5f3",
    unspoken: "#8c8c8a",
    accent: "#ffffff",
    scrim: "rgba(0,0,0,0.55)",
    textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.7)",
    endTitle: "#f8f8f6",
    endSub: "#c6c6c4",
  },
  cinematic: {
    bg: "#0b1113",
    spoken: "#eef2f3",
    unspoken: "#8fa0a4",
    accent: "#f2b64c",
    scrim: "rgba(5,11,13,0.58)",
    textShadow: "0 4px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6)",
    endTitle: "#eef2f3",
    endSub: "#b9c6c9",
  },
  painterly: {
    bg: "#12100e", // deep warm near-black
    spoken: "#f4efe6", // warm off-white
    unspoken: "#a79c8c",
    accent: "#f2b64c", // warm gold — matches the golden-hour color plates
    scrim: "rgba(10,8,6,0.62)",
    textShadow: "0 4px 30px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.55)",
    endTitle: "#f6f1e8",
    endSub: "#cabfae",
  },
  // The one light look: mono ink on the site's cream paper.
  engraving: {
    bg: COLORS.bg,
    spoken: COLORS.textPrimary,
    unspoken: COLORS.textMuted,
    accent: COLORS.accent,
    // light band + a paper halo, rather than a dark scrim + drop shadow
    scrim: "rgba(241,239,236,0.80)",
    textShadow: "0 2px 16px rgba(241,239,236,0.95), 0 0 3px rgba(241,239,236,0.9)",
    endTitle: COLORS.textPrimary,
    endSub: COLORS.textSecondary,
  },
};

export const SITE = "apeirron.com";
