// One runner for the whole vertical-shorts pipeline. From a node it authors 3-4
// punchy ~40s scripts, then for each short: narrates it (Kokoro), authors image
// cues, generates the FLUX plates, and renders the 9:16 mp4 into out/.
//
//   node shorts.mjs <node>              # whole node → 3-4 mp4s in out/
//   node shorts.mjs <node> <slug>       # just that one short, full chain
//   node shorts.mjs <node> --scripts    # stop after authoring scripts (review first)
//
// Flags: --count N (new scripts per run, default 1) · --model NAME · --style
// ink|noir|cinematic|painterly|engraving (image look + matching caption
// palette, default ink) · --force (redo every stage) · --render-only (skip
// narrate/cues/plates, just re-render). Output is out/<node>-<slug>-<style>.mp4.
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
import { updateRoadmap } from "./lib/roadmap.mjs";
import { THEMES } from "./src/theme.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const SPEECH = join(REPO, "speech");
const PUBLIC = join(HERE, "public");
const OUT = join(HERE, "out");
const OLLAMA = "http://localhost:11434/api/chat";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
// Positionals = args that are neither a --flag nor the value of a value-taking flag.
const VALUE_OPTS = ["model", "count", "style"];
const [node, wantSlug] = argv.filter((a, i) => {
  if (a.startsWith("--")) return false;
  const prev = argv[i - 1];
  return !(prev?.startsWith("--") && VALUE_OPTS.includes(prev.slice(2)));
});
const force = flag("force");
const MODEL = opt("model", "qwen3.5:9b");
const COUNT = Number(opt("count", 1)); // one new short per run by default
const STYLES = Object.keys(THEMES); // must stay in sync with STYLES in image.py
const STYLE = opt("style", "ink"); // signature brand look

if (!node) {
  console.error(
    `usage: node shorts.mjs <node> [slug] [--scripts] [--render-only] [--count N] [--model NAME] [--style ${STYLES.join("|")}] [--force]`,
  );
  process.exit(1);
}
if (!STYLES.includes(STYLE)) {
  console.error(`unknown --style ${STYLE} (choose ${STYLES.join(" | ")})`);
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

const SCRIPT_SYSTEM = `You are a master short-form video storyteller (YouTube Shorts, Reels, TikTok). From the article, write ${COUNT} DISTINCT self-contained shorts. Each tells ONE gripping idea from the article as a STORY, not an explainer.

THE FIRST SENTENCE decides everything. It MUST open on a concrete anchor that THE ARTICLE BELOW actually names — a real person, year, place, experiment, or event from THIS article — and drop us mid-scene. Follow this SHAPE, but fill every blank with the article's own details (this is a template, never copy it literally): "In <year from the article>, <a real person the article names> <did something specific> at <a real place>…".
NEVER open with a hypothetical or a definition: no "Imagine…", "Picture…", "Have you ever wondered…", "We can map…", "This is <topic>…", and no rhetorical questions.

Then tell the story tight — this is a ~50 second narration, so every sentence must earn its place:
- BUILD (the body, 3-4 sentences): raise the tension and reveal it with concrete, human detail — the specific people, the place, the numbers, what was seen, said, or done. Pick the single most gripping specific and cut the rest.
- TURN: the surprising, unsettling, or mind-bending revelation — the "wait, what?" moment.
- LAND: one short, punchy closing line that lingers. A STATEMENT, never a question. No "in conclusion", no vague "the universe is strange".

Hard rules:
- Use ONLY the names, dates, places, and facts found in the article below. Do NOT import people, stories, or examples from other topics or from these instructions — if a name or event is not in THIS article, it must not appear in the script. (No borrowing famous examples like wine bets, bats, or philosophers the article never mentions.)
- Ground EVERY claim in the article. Use its real names, dates, places, numbers. Invent nothing.
- Sentence one must name a real person, year, place, or specific event that appears in the article.
- NO rhetorical questions anywhere — not in the hook, not at the end.
- Spoken narration only — no stage directions, labels, emojis, or hashtags.
- Write for the ear: vary sentence length, mostly punchy with some longer sentences for rhythm.
- Use "you" at most once, and only if it sharpens a moment.
- LENGTH IS CRITICAL: each script MUST be 110 to 130 words — roughly 45 to 55 seconds spoken, and never over 60 seconds. Anything over 135 words is too long and will be rejected. Be punchy and economical; one vivid specific beats three. Count the words before returning.

Return ONLY JSON: {"shorts":[{"title":"3-6 word title","hook":"the opening sentence","script":"the full ~100 word narration"}]}`;

// Local models are flaky about count + length: qwen often returns fewer than
// COUNT shorts and ignores the word limit. So validate each script (word count
// in range) and retry, accumulating unique valid shorts until we have COUNT.
const WORDS_MIN = 100;
const WORDS_MAX = 135; // ~45-55s spoken, safely under 60s
const MAX_TRIES = 10;
const wordCount = (s) => s.trim().split(/\s+/).length;

// One-video-per-run with cross-run memory: shorts/<node>.json accumulates EVERY
// short ever generated for the node. Each run authors COUNT new short(s) whose
// angle differs from all of those (the prior titles are fed to the model as a
// hard "do not repeat" list), appends them, and returns only the new ones so the
// pipeline renders just those. Re-running the node keeps producing fresh angles.
function loadHistory() {
  const outPath = join(HERE, "shorts", `${node}.json`);
  const shorts = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")).shorts || [] : [];
  return { outPath, shorts };
}

async function authorScripts() {
  const { outPath, shorts: history } = loadHistory();
  // Re-render / target an existing short: reuse memory, don't author anything new.
  if (flag("render-only") || wantSlug) return history;

  const md = readFileSync(join(REPO, "content/nodes", `${node}.md`), "utf8");
  const user = `ARTICLE:\n\n${cleanArticle(md)}`;
  const badOpener = /^\s*(imagine|picture|have you|what if|think about|consider|suppose|ever wonder)\b/i;
  const seen = new Set(history.map((s) => s.slug));

  const fresh = new Map();
  for (let attempt = 1; attempt <= MAX_TRIES && fresh.size < COUNT; attempt++) {
    console.log(`> ${MODEL}: writing ${COUNT} new short(s) (attempt ${attempt}, have ${fresh.size}/${COUNT})…`);
    // Memory: every angle already made for this node (past runs + this run) is a
    // hard exclusion so we never repeat a script.
    const taken = [...history.map((s) => s.title), ...[...fresh.values()].map((s) => s.title)];
    const userMsg = taken.length
      ? `${user}\n\nThis node ALREADY has the shorts listed below. Each new short MUST cover a completely DIFFERENT idea, angle, and thought experiment from the article — do NOT repeat, rephrase, or overlap any of these:\n- ${taken.join("\n- ")}`
      : user;
    let parsed;
    try {
      parsed = await askJSON(SCRIPT_SYSTEM, userMsg, { temperature: 0.85, num_ctx: 32768 });
    } catch (e) {
      console.log(`  ! attempt failed: ${e.message}`);
      continue;
    }
    for (const s of parsed.shorts || []) {
      if (!s || !s.script || !s.title) continue;
      const sl = slug(s.title);
      if (!sl || seen.has(sl) || fresh.has(sl)) continue;
      const script = s.script.trim();
      const w = wordCount(script);
      if (w < WORDS_MIN || w > WORDS_MAX) {
        console.log(`  – dropped "${s.title}" (${w} words, want ${WORDS_MIN}-${WORDS_MAX})`);
        continue;
      }
      if (badOpener.test(script)) {
        console.log(`  – dropped "${s.title}" (banned opener)`);
        continue;
      }
      fresh.set(sl, {
        slug: sl,
        title: s.title.trim(),
        hook: (s.hook || script.split(/(?<=[.!?])\s/)[0]).trim(),
        script,
      });
      if (fresh.size >= COUNT) break;
    }
  }

  const newShorts = [...fresh.values()].slice(0, COUNT);
  if (!newShorts.length) throw new Error(`no valid new script for ${node} — model may be down; retry`);

  mkdirSync(join(HERE, "shorts"), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ id: node, shorts: [...history, ...newShorts] }, null, 2) + "\n");
  console.log(`> shorts/${node}.json — +${newShorts.length} new (${history.length + newShorts.length} total for node):`);
  for (const s of newShorts) console.log(`  [${s.slug}] ${s.title}  (~${wordCount(s.script)} words)`);
  return newShorts;
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
  const args = ["run", join(HERE, "image.py"), "--prompts", cues, "--style", STYLE];
  if (force) args.push("--force");
  await run("uv", args, HERE);
}

// Derive one caption palette for this short from its plates (painterly only —
// the graded looks keep their fixed theme). Fast, PIL only, no model load.
async function generatePalette(short) {
  const cues = join(HERE, "shorts", "images", `${node}-${short.slug}.json`);
  const out = join(HERE, "shorts", "images", `${node}-${short.slug}.palette.json`);
  await run("uv", ["run", join(HERE, "palette.py"), "--prompts", cues, "--out", out], HERE);
  return existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : null;
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
  plan.style = STYLE; // picks the composition's base palette (captions + scrim)
  if (STYLE === "painterly") plan.palette = await generatePalette(short); // context-matched colors
  const composition = await ctx.selectComposition({ serveUrl: ctx.serveUrl, id: "short", inputProps: plan });
  mkdirSync(OUT, { recursive: true });
  const out = join(OUT, `${node}-${short.slug}-${STYLE}.mp4`);
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
  console.log(`\r> done — out/${node}-${short.slug}-${STYLE}.mp4`);
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

  updateRoadmap(); // log the new short(s) into shorts-roadmap.md (the memory view)
  console.log(`\n> all done — ${shorts.length} mp4${shorts.length > 1 ? "s" : ""} in out/ · roadmap updated`);
}

main().catch((e) => {
  console.error(`\n> [error]: ${e.message}`);
  process.exit(1);
});
