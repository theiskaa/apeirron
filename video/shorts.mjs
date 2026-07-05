// One runner for the whole vertical-shorts pipeline. From a node it authors 3-4
// punchy ~40s scripts, then for each short: narrates it (Kokoro), authors image
// cues, generates the FLUX plates, and renders the 9:16 mp4 into out/.
//
//   node shorts.mjs <node>              # whole node → 3-4 mp4s in out/
//   node shorts.mjs <node> <slug>       # just that one short, full chain
//   node shorts.mjs <node> --scripts    # stop after authoring scripts (review first)
//
// Flags: --count N (scripts, default 4) · --model NAME · --force (redo every
// stage) · --render-only (skip narrate/cues/plates, just re-render).
//
// Every stage is cached — it skips work whose output already exists unless
// --force. Fully local: Ollama for text, Kokoro (speech/) for voice, FLUX
// (image.py) for plates. No API keys.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeWord, findPhraseStart } from "./lib/clean-heading.mjs";
import { buildShortPlan } from "./lib/short-plan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const SPEECH = join(REPO, "speech");
const PUBLIC = join(HERE, "public");
const OUT = join(HERE, "out");
const OLLAMA = "http://localhost:11434/api/chat";

const argv = process.argv.slice(2);
const [node, wantSlug] = argv.filter((a) => !a.startsWith("--"));
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const force = flag("force");
const MODEL = opt("model", "qwen3.5:9b");
const COUNT = Number(opt("count", 4));

if (!node) {
  console.error(
    "usage: node shorts.mjs <node> [slug] [--scripts] [--render-only] [--count N] [--model NAME] [--force]",
  );
  process.exit(1);
}

const slug = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

// Spawn a child, inheriting stdio, and resolve when it exits 0.
function run(cmd, args, cwd) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd, stdio: "inherit" });
    p.on("error", rej);
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
  });
}

// Ask Ollama for JSON and robustly extract the object (models sometimes wrap it
// in prose despite format:"json").
async function askJSON(system, user, options) {
  const res = await fetch(OLLAMA, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      format: "json",
      stream: false,
      think: false,
      options,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  }).catch((e) => {
    throw new Error(`Ollama not reachable at ${OLLAMA} — is it running? (${e.message})`);
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const content = (await res.json()).message?.content || "";
  for (const s of [content, (content.match(/\{[\s\S]*\}/) || [])[0]]) {
    if (!s) continue;
    try {
      return JSON.parse(s);
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error("model did not return valid JSON — try again");
}

function cleanArticle(md) {
  return md
    .replace(/^\s*---[\s\S]*?---\s*\n/, "")
    .replace(/\n#{1,6}\s*Sources\b[\s\S]*$/i, "")
    .replace(/\[\[([^\]]+)\]\]/g, (_, x) => x.split("|").pop().replace(/-/g, " "))
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const SCRIPT_SYSTEM = `You are a viral short-form video scriptwriter (YouTube Shorts, Reels, TikTok). From the article, write ${COUNT} DISTINCT self-contained short scripts, each about a different gripping idea from the article.
Each script MUST:
- Open with a HOOK in the first sentence: a sharp question or a bold, curiosity-provoking claim that stops the scroll.
- Deliver ONE fascinating idea, with a concrete specific fact or name from the article.
- Be spoken narration ONLY — no stage directions, no "in this video", no emojis, no hashtags.
- Be about 90 to 110 words (roughly 40 seconds when spoken).
- End on a punchy, thought-provoking closing line.
Voice: punchy, vivid, conversational, confident. Ground every claim in the article — do not invent facts.
Return ONLY JSON: {"shorts":[{"title":"3-6 word title","hook":"the opening sentence","script":"the full ~100 word narration"}]}`;

async function authorScripts() {
  const outPath = join(HERE, "shorts", `${node}.json`);
  if (existsSync(outPath) && !force) {
    return JSON.parse(readFileSync(outPath, "utf8")).shorts;
  }
  const md = readFileSync(join(REPO, "content/nodes", `${node}.md`), "utf8");
  console.log(`> ${MODEL}: writing ${COUNT} scripts…`);
  const parsed = await askJSON(SCRIPT_SYSTEM, `ARTICLE:\n\n${cleanArticle(md)}`, {
    temperature: 0.7,
    num_ctx: 32768,
  });

  const seen = new Set();
  const shorts = (parsed.shorts || [])
    .filter((s) => s && s.script && s.title)
    .map((s, i) => ({
      slug: slug(s.title) || `short-${i + 1}`,
      title: s.title.trim(),
      hook: (s.hook || s.script.split(/(?<=[.!?])\s/)[0]).trim(),
      script: s.script.trim(),
    }))
    .filter((s) => !seen.has(s.slug) && seen.add(s.slug));

  mkdirSync(join(HERE, "shorts"), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ id: node, shorts }, null, 2) + "\n");
  console.log(`> shorts/${node}.json — ${shorts.length} shorts:`);
  for (const s of shorts) {
    console.log(`  [${s.slug}] ${s.title}  (~${s.script.split(/\s+/).length} words)`);
  }
  return shorts;
}

// Narrate the script with Kokoro → mp3 + word timings.
async function narrate(short) {
  const dir = join(HERE, "shorts", "audio");
  mkdirSync(dir, { recursive: true });
  const stem = join(dir, `${node}-${short.slug}`);
  if (existsSync(stem + ".timings.json") && !force) return;
  writeFileSync(stem + ".txt", short.script + "\n");
  console.log(`> narrating ${short.slug}…`);
  await run("uv", ["run", "python", "generate.py", stem + ".txt", stem + ".mp3"], SPEECH);
}

const CUE_SYSTEM = `You illustrate a fast vertical video. Given a short narration, list 12 to 16 vivid, concrete, DRAWABLE moments — people (by name), creatures, objects, machines, places, dramatic scenes — spread evenly across the whole narration so there is always something to show. Skip purely abstract words.
For each, return:
- "anchor": a short phrase of 2 to 5 words COPIED EXACTLY (verbatim) from the narration.
- "label": 1-3 words naming the thing.
- "prompt": a vivid 5 to 10 word description of a dramatic full-scene illustration (concrete and visual; no art-style words).
Output ONLY JSON: {"items":[{"anchor":"...","label":"...","prompt":"..."}]}`;

async function authorCues(short) {
  const outPath = join(HERE, "shorts", "images", `${node}-${short.slug}.json`);
  if (existsSync(outPath) && !force) return;
  const timings = JSON.parse(
    readFileSync(join(HERE, "shorts", "audio", `${node}-${short.slug}.timings.json`), "utf8"),
  );
  const stream = (timings.words || []).map(([w, s]) => ({ norm: normalizeWord(w), start: s }));

  console.log(`> ${MODEL}: image cues for ${short.slug}…`);
  const parsed = await askJSON(CUE_SYSTEM, `NARRATION:\n\n${short.script}`, {
    temperature: 0.5,
    num_ctx: 8192,
  });

  let ptr = 0;
  const cues = [];
  for (const it of parsed.items || []) {
    if (!it || !it.anchor || !it.label || !it.prompt) continue;
    const toks = it.anchor.split(/\s+/).map(normalizeWord).filter(Boolean);
    let i = -1;
    for (let n = toks.length; n >= 2 && i < 0; n--) i = findPhraseStart(stream, toks.slice(0, n), ptr);
    if (i < 0) continue;
    ptr = i;
    cues.push({
      time: Math.round(stream[i].start * 100) / 100,
      label: it.label.trim(),
      prompt: it.prompt.trim(),
    });
  }
  cues.sort((a, b) => a.time - b.time);

  mkdirSync(join(HERE, "shorts", "images"), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ id: node, slug: short.slug, cues }, null, 2) + "\n");
  console.log(`> ${cues.length} image cues for ${short.slug}`);
}

// Generate the FLUX plates for this short's cues (image.py skips existing).
async function generatePlates(short) {
  const cues = join(HERE, "shorts", "images", `${node}-${short.slug}.json`);
  console.log(`> FLUX plates for ${short.slug}…`);
  const args = ["run", join(HERE, "image.py"), "--prompts", cues];
  if (force) args.push("--force");
  await run("uv", args, HERE);
}

// Audio must sit under public/ before the bundle so staticFile() resolves it.
function stageAudio(short) {
  mkdirSync(join(PUBLIC, "shorts"), { recursive: true });
  const src = join(HERE, "shorts", "audio", `${node}-${short.slug}.mp3`);
  if (!existsSync(src)) throw new Error(`no audio for ${short.slug} — narrate it first`);
  copyFileSync(src, join(PUBLIC, `shorts/${node}-${short.slug}.mp3`));
}

async function renderShort(short, ctx) {
  const plan = buildShortPlan(node, short.slug);
  plan.audioFile = `shorts/${node}-${short.slug}.mp3`;
  const composition = await ctx.selectComposition({ serveUrl: ctx.serveUrl, id: "short", inputProps: plan });
  mkdirSync(OUT, { recursive: true });
  const out = join(OUT, `${node}-${short.slug}.mp4`);
  console.log(
    `> rendering ${short.slug} · ${composition.width}x${composition.height} · ${composition.durationInFrames}f`,
  );
  await ctx.renderMedia({
    serveUrl: ctx.serveUrl,
    composition,
    codec: "h264",
    outputLocation: out,
    inputProps: plan,
    scale: 1.5, // 1620x2880 master, downsampled from the native FLUX plates
    crf: 16,
    jpegQuality: 100,
    x264Preset: "slow",
    onProgress: ({ progress }) => process.stdout.write(`\r  ${Math.round(progress * 100)}%   `),
  });
  console.log(`\r> done — out/${node}-${short.slug}.mp4`);
}

async function main() {
  let shorts = await authorScripts();
  if (wantSlug) {
    shorts = shorts.filter((s) => s.slug === wantSlug);
    if (!shorts.length) throw new Error(`no short "${wantSlug}" in shorts/${node}.json`);
  }
  if (flag("scripts")) {
    console.log("> --scripts: stopping after authoring. Review, then re-run without --scripts.");
    return;
  }

  const renderOnly = flag("render-only");
  for (const s of shorts) {
    if (!renderOnly) {
      await narrate(s);
      await authorCues(s);
      await generatePlates(s);
    }
    stageAudio(s);
  }

  // Bundle once (all plates + audio are now staged), then render each short.
  const { bundle } = await import("@remotion/bundler");
  const { selectComposition, renderMedia } = await import("@remotion/renderer");
  console.log("> bundling…");
  const serveUrl = await bundle({ entryPoint: join(HERE, "src", "index.ts"), publicDir: PUBLIC });
  const ctx = { serveUrl, selectComposition, renderMedia };
  for (const s of shorts) await renderShort(s, ctx);

  console.log(`\n> all done — ${shorts.length} mp4${shorts.length > 1 ? "s" : ""} in out/`);
}

main().catch((e) => {
  console.error(`\n> [error]: ${e.message}`);
  process.exit(1);
});
