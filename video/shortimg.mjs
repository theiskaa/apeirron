// Author the image cues for one short: an Ollama pass over its script + Kokoro
// timings picks ~12-16 vivid DRAWABLE moments, evenly spread, each with a real
// full-scene prompt and a verbatim anchor resolved to a timestamp. Writes
// video/shorts/images/<id>-<slug>.json; image.py generates one plate per cue.
//
//   node shortimg.mjs <node-id> <slug> [--force]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeWord, findPhraseStart } from "./lib/clean-heading.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OLLAMA = "http://localhost:11434/api/chat";

const argv = process.argv.slice(2);
const [id, wantSlug] = argv.filter((a) => !a.startsWith("--"));
const force = argv.includes("--force");
if (!id || !wantSlug) {
  console.error("usage: node shortimg.mjs <node-id> <slug> [--force]");
  process.exit(1);
}

const SYSTEM = `You illustrate a fast vertical video. Given a short narration, list 12 to 16 vivid, concrete, DRAWABLE moments — people (by name), creatures, objects, machines, places, dramatic scenes — spread evenly across the whole narration so there is always something to show. Skip purely abstract words.
For each, return:
- "anchor": a short phrase of 2 to 5 words COPIED EXACTLY (verbatim) from the narration.
- "label": 1-3 words naming the thing.
- "prompt": a vivid 5 to 10 word description of a dramatic full-scene illustration (concrete and visual; no art-style words).
Output ONLY JSON: {"items":[{"anchor":"...","label":"...","prompt":"..."}]}`;

async function main() {
  const outPath = join(HERE, "shorts", "images", `${id}-${wantSlug}.json`);
  if (existsSync(outPath) && !force) {
    console.log(`> ${id}-${wantSlug}.json exists — --force to re-author`);
    return;
  }
  const short = JSON.parse(readFileSync(join(HERE, "shorts", `${id}.json`), "utf8")).shorts.find(
    (s) => s.slug === wantSlug,
  );
  if (!short) throw new Error(`no short "${wantSlug}"`);
  const timings = JSON.parse(
    readFileSync(join(HERE, "shorts", "audio", `${id}-${wantSlug}.timings.json`), "utf8"),
  );
  const stream = (timings.words || []).map(([w, s]) => ({ norm: normalizeWord(w), start: s }));

  const res = await fetch(OLLAMA, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: "qwen3.5:9b",
      format: "json",
      stream: false,
      think: false,
      options: { temperature: 0.5, num_ctx: 8192 },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `NARRATION:\n\n${short.script}` },
      ],
    }),
  }).catch((e) => {
    throw new Error(`Ollama not reachable — is it running? (${e.message})`);
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const content = (await res.json()).message?.content || "";
  let items = [];
  for (const s of [content, (content.match(/\{[\s\S]*\}/) || [])[0]]) {
    if (!s) continue;
    try {
      items = JSON.parse(s).items || [];
      break;
    } catch {
      /* next */
    }
  }

  let ptr = 0;
  const cues = [];
  for (const it of items) {
    if (!it || !it.anchor || !it.label || !it.prompt) continue;
    const toks = it.anchor.split(/\s+/).map(normalizeWord).filter(Boolean);
    let i = -1;
    for (let n = toks.length; n >= 2 && i < 0; n--) i = findPhraseStart(stream, toks.slice(0, n), ptr);
    if (i < 0) continue;
    ptr = i;
    cues.push({ time: Math.round(stream[i].start * 100) / 100, label: it.label.trim(), prompt: it.prompt.trim() });
  }
  cues.sort((a, b) => a.time - b.time);

  mkdirSync(join(HERE, "shorts", "images"), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ id, slug: wantSlug, cues }, null, 2) + "\n");
  console.log(`> ${id}-${wantSlug}.json — ${cues.length} image cues`);
  for (const c of cues) console.log(`    ${c.time.toFixed(1).padStart(6)}  ${c.label} — ${c.prompt}`);
}

main().catch((e) => {
  console.error(`> [error]: ${e.message}`);
  process.exit(1);
});
