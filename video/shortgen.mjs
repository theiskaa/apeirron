// Render a node's vertical shorts. For now (stage 2) renders one short by slug;
// the full orchestrator (author → narrate → images → render all) lands in stage 4.
//
//   node shortgen.mjs <node-id> <slug>

import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildShortPlan } from "./lib/short-plan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, "public");
const OUT = join(HERE, "out");

async function renderShort(id, wantSlug) {
  const plan = buildShortPlan(id, wantSlug);

  // stage the narration mp3 where staticFile() can find it
  mkdirSync(join(PUBLIC, "shorts"), { recursive: true });
  const rel = `shorts/${id}-${plan.slug}.mp3`;
  const src = join(HERE, "shorts", "audio", `${id}-${plan.slug}.mp3`);
  if (!existsSync(src)) throw new Error(`no audio at ${src} — narrate the short first`);
  copyFileSync(src, join(PUBLIC, rel));
  plan.audioFile = rel;

  const { bundle } = await import("@remotion/bundler");
  const { selectComposition, renderMedia } = await import("@remotion/renderer");

  console.log("> bundling…");
  const serveUrl = await bundle({
    entryPoint: join(HERE, "src", "index.ts"),
    publicDir: PUBLIC,
  });
  const composition = await selectComposition({ serveUrl, id: "short", inputProps: plan });

  mkdirSync(OUT, { recursive: true });
  const out = join(OUT, `${id}-${plan.slug}.mp4`);
  console.log(
    `> rendering ${composition.width}x${composition.height} · ${composition.durationInFrames} frames → ${out}`,
  );
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    outputLocation: out,
    inputProps: plan,
    scale: 1.5, // 1620x2880 master — crisper than 1080p, downsampled from 2x plates
    crf: 16,
    jpegQuality: 100,
    x264Preset: "slow",
    onProgress: ({ progress }) => process.stdout.write(`\r> ${Math.round(progress * 100)}%   `),
  });
  console.log(`\n> done — ${out}`);
}

const [id, wantSlug] = process.argv.slice(2);
if (!id || !wantSlug) {
  console.error("usage: node shortgen.mjs <node-id> <slug>");
  process.exit(1);
}
renderShort(id, wantSlug).catch((e) => {
  console.error(`\n> [error]: ${e.message}`);
  process.exit(1);
});
