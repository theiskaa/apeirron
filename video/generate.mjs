// Render a node's narrated Markdown into a YouTube-ready MP4, synced to the Kokoro
// word timings. The video counterpart of speech/generate.py.
//
// Usage (run from this directory):
//   node generate.mjs --check <node-id>            preview the scene plan + cue
//                                                  candidates; writes cues/<id>.json.
//                                                  Fast, no render.
//   node generate.mjs <node-id> <output.mp4>       render the MP4. Any missing cue
//                                                  plates are generated first via
//                                                  image.py (FLUX loads once, cached
//                                                  plates are reused).
//   node generate.mjs <node-id> <out.mp4> --no-images   skip plate generation.
//   node generate.mjs <node-id> <out.mp4> --audio <file.mp3>   use a local MP3.
//
// Inputs are the artifacts the speech pipeline already produced (word timings,
// waveform) plus the node Markdown; the narration MP3 is taken from a local
// speech/<id>.mp3 if present, otherwise downloaded from audio.apeirron.com.

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildScenePlan } from "./lib/scene-plan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const AUDIO_BASE = "https://audio.apeirron.com";
const PUBLIC_DIR = join(HERE, "public");
const CUES_DIR = join(HERE, "cues");

const fmt = (s) => {
  const total = Math.floor(s); // floor, not round — avoids rolling seconds to :60
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

// Persist the auto-extracted cues to cues/<id>.json, but never clobber the
// `asset` or `prompt` values a human has filled in — merge by term so re-running
// --check is safe.
function mergeAndSaveCues(id, freshCues) {
  const path = join(CUES_DIR, `${id}.json`);
  const prev = new Map();
  if (existsSync(path)) {
    try {
      for (const c of JSON.parse(readFileSync(path, "utf8")).cues || []) {
        prev.set(c.term, c);
      }
    } catch {
      /* corrupt file — regenerate from scratch */
    }
  }
  const cues = freshCues.map((c) => {
    const p = prev.get(c.term) || {};
    return {
      ...c,
      prompt: p.prompt ?? c.prompt ?? null,
      asset: p.asset ?? c.asset,
    };
  });
  mkdirSync(CUES_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify({ id, cues }, null, 2) + "\n");
  return cues;
}

function printCheck(plan) {
  console.log("=".repeat(50));
  console.log(`> ${plan.title}  [${plan.category}]`);
  console.log("=".repeat(50));
  console.log(`> id:        ${plan.id}`);
  console.log(
    `> duration:  ${fmt(plan.duration)} (${plan.words.length} words)`,
  );
  console.log(`> accent:    ${plan.color}`);

  console.log(`\n> sections (${plan.sections.length}):`);
  for (const s of plan.sections) {
    console.log(`    ${fmt(s.start).padStart(6)}  ${s.title}`);
  }

  const spoken = plan.cues.filter((c) => c.time != null);
  console.log(
    `\n> cue candidates (${plan.cues.length}, ${spoken.length} spoken on-screen):`,
  );
  for (const c of plan.cues.slice(0, 24)) {
    const when = c.time == null ? "  —  " : fmt(c.time).padStart(6);
    const has = c.asset ? ` → ${c.asset}` : "";
    console.log(`    ${when}  [${c.kind}] ${c.term}${has}`);
  }
  if (plan.cues.length > 24)
    console.log(`    … +${plan.cues.length - 24} more`);
}

// Slug used for a cue's plate file — must match image.py's _slug().
const slugify = (t) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Ensure the LLM-authored shot list exists (author it with Ollama if not) and
// every shot has a plate (generate the missing ones with FLUX, model loaded once).
// Cheap on re-render: if the shot list and all plates are present, nothing runs.
// --no-images skips both, leaving a typography-only video.
function ensureShots(id, noImages) {
  const shotsPath = join(HERE, "shots", `${id}.json`);
  if (noImages) {
    if (!existsSync(shotsPath)) console.log("> images: skipped (--no-images)");
    return;
  }
  if (!existsSync(shotsPath)) {
    console.log("> shots: authoring the shot list with Ollama…");
    const r = spawnSync("node", ["shots.mjs", id], { cwd: HERE, stdio: "inherit" });
    if (r.status !== 0) {
      throw new Error(
        `shot authoring failed — run \`node shots.mjs ${id}\` to debug, or pass --no-images`,
      );
    }
  }
  const shots = JSON.parse(readFileSync(shotsPath, "utf8")).shots || [];
  const platesDir = join(PUBLIC_DIR, "plates");
  const missing = shots.filter(
    (s) => !existsSync(join(platesDir, `${slugify(s.subject)}.png`)),
  );
  if (missing.length) {
    console.log(`> images: generating ${missing.length} missing plate(s) with FLUX…`);
    const r = spawnSync("uv", ["run", "image.py", "--all", id], {
      cwd: HERE,
      stdio: "inherit",
    });
    if (r.status !== 0) {
      throw new Error(
        `image generation failed — run \`uv run image.py --all ${id}\` to debug, or pass --no-images`,
      );
    }
  }
}

// Put the narration MP3 where the Remotion bundle's staticFile() can find it.
async function stageAudio(id, override) {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const dest = join(PUBLIC_DIR, `${id}.mp3`);

  const local = override || join(REPO, "speech", `${id}.mp3`);
  if (existsSync(local)) {
    copyFileSync(local, dest);
    console.log(`> audio: copied ${local}`);
    return `${id}.mp3`;
  }

  const url = `${AUDIO_BASE}/${id}.mp3`;
  console.log(`> audio: downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `could not fetch ${url} (${res.status}) — narrate/publish the node first, or pass --audio <file.mp3>`,
    );
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return `${id}.mp3`;
}

async function render(id, output, audioOverride, noImages) {
  ensureShots(id, noImages); // author shots + generate plates before the plan resolves them
  const plan = buildScenePlan(id);
  plan.cues = mergeAndSaveCues(id, plan.cues);
  plan.audioFile = await stageAudio(id, audioOverride);

  // Remotion is heavy — import it only on the render path so --check stays fast.
  const { bundle } = await import("@remotion/bundler");
  const { selectComposition, renderMedia } = await import("@remotion/renderer");

  console.log("> bundling composition…");
  const serveUrl = await bundle({
    entryPoint: join(HERE, "src", "index.ts"),
    publicDir: PUBLIC_DIR,
  });

  const composition = await selectComposition({
    serveUrl,
    id: "node",
    inputProps: plan,
  });

  console.log(
    `> rendering ${composition.width}x${composition.height} · ${composition.durationInFrames} frames → ${output}`,
  );
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    outputLocation: output,
    inputProps: plan,
    onProgress: ({ progress }) =>
      process.stdout.write(`\r> ${Math.round(progress * 100)}%   `),
  });
  console.log(`\n> done — ${output}`);
}

const argv = process.argv.slice(2);
const check = argv.includes("--check");
const noImages = argv.includes("--no-images");
const audioIdx = argv.indexOf("--audio");
const audioOverride = audioIdx >= 0 ? argv[audioIdx + 1] : undefined;
const positionals = argv.filter(
  (a, i) => !a.startsWith("--") && (audioIdx < 0 || i !== audioIdx + 1),
);

if (check) {
  const id = positionals[0];
  if (!id) {
    console.error("usage: node generate.mjs --check <node-id>");
    process.exit(1);
  }
  const plan = buildScenePlan(id);
  plan.cues = mergeAndSaveCues(id, plan.cues);
  printCheck(plan);
  console.log(`\n> wrote cues/${id}.json`);
} else {
  const [id, output] = positionals;
  if (!id || !output) {
    console.error(
      "usage: node generate.mjs <node-id> <output.mp4> [--no-images] [--audio <file.mp3>]",
    );
    process.exit(1);
  }
  render(id, output, audioOverride, noImages).catch((err) => {
    console.error(`\n> [error]: ${err.message}`);
    process.exit(1);
  });
}
