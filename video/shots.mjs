// Author a rich visual "shot list" for a node with a LOCAL LLM (Ollama), no API
// key. Reads the narration transcript + word timings and asks the model for the
// people, concepts, scenes and objects worth illustrating — each with a detailed
// image prompt and a verbatim anchor phrase we resolve to an exact timestamp.
//
//   node shots.mjs <node-id> [--model qwen3.5:9b] [--force]
//
// Writes video/shots/<id>.json. image.py generates a plate per shot; the video
// composites them cinematically at their times.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeWord, findPhraseStart } from "./lib/clean-heading.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const OLLAMA = "http://localhost:11434/api/chat";

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith("--"));
const force = argv.includes("--force");
const modelIdx = argv.indexOf("--model");
const MODEL = modelIdx >= 0 ? argv[modelIdx + 1] : "qwen3.5:9b";

if (!id) {
  console.error("usage: node shots.mjs <node-id> [--model <name>] [--force]");
  process.exit(1);
}

// Rough plain-text of the node for the model (anchors resolve against the real
// word stream, so this only needs to be readable, not exact).
function cleanText(md) {
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

// Resolve an anchor phrase to a start second in the spoken stream. Tries the
// whole phrase, then shorter prefixes, so a slightly-paraphrased anchor from the
// model still lands somewhere sensible.
function resolveTime(anchor, stream) {
  const toks = anchor.split(/\s+/).map(normalizeWord).filter(Boolean);
  for (let n = toks.length; n >= 2; n--) {
    const i = findPhraseStart(stream, toks.slice(0, n));
    if (i >= 0) return stream[i].start;
  }
  return null;
}

const SYSTEM = `You are the visual director for an illustrated educational video narrated from a transcript.
Return a JSON shot list of the moments worth illustrating: the PEOPLE named (scientists, thinkers, historical figures), the key CONCEPTS, vivid SCENES, and notable OBJECTS or PLACES.
Aim for one shot roughly every 25-40 seconds of narration — for a long transcript that is 30 to 50 shots. Spread them across the whole piece, not just the start.
For each shot return:
- "anchor": a short phrase of 3 to 6 words COPIED EXACTLY (verbatim) from the transcript, marking where in the narration the image should appear.
- "kind": one of "person", "concept", "scene", "object", "place".
- "subject": a short label. For a person, their full name. For others, 2-4 words.
- "prompt": a concrete, visual 12-25 word description of the image to draw. Describe subject matter only — do NOT mention art style, engraving, color, or the medium. For a person, describe a dignified portrait of them. Be specific and evocative.
Output ONLY JSON of the form: {"shots": [ { "anchor": "...", "kind": "...", "subject": "...", "prompt": "..." }, ... ] }`;

async function main() {
  const outPath = join(HERE, "shots", `${id}.json`);
  if (existsSync(outPath) && !force) {
    console.log(`> shots/${id}.json exists — pass --force to re-author`);
    return;
  }

  const md = readFileSync(join(REPO, "content/nodes", `${id}.md`), "utf8");
  const timings = JSON.parse(
    readFileSync(join(REPO, "public/audio-timings", `${id}.json`), "utf8"),
  );
  const words = timings.words || [];
  const stream = words.map(([w, s]) => ({ norm: normalizeWord(w), start: s }));
  const transcript = cleanText(md);

  console.log(`> asking ${MODEL} for a shot list (${transcript.split(/\s+/).length} words)…`);
  const res = await fetch(OLLAMA, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      format: "json",
      stream: false,
      // Disable the model's reasoning pass — it burns context and can truncate the
      // JSON on a long transcript; we want the shot list directly. Large num_ctx so
      // the whole essay plus the shot list fit.
      think: false,
      options: { temperature: 0.4, num_ctx: 32768 },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `TRANSCRIPT:\n\n${transcript}` },
      ],
    }),
  }).catch((e) => {
    throw new Error(`Ollama not reachable at ${OLLAMA} — is it running? (${e.message})`);
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

  const data = await res.json();
  let parsed;
  try {
    parsed = JSON.parse(data.message.content);
  } catch {
    throw new Error("model did not return valid JSON — try again or a different --model");
  }
  const raw = parsed.shots || parsed.shotlist || [];

  const seen = new Set();
  const shots = [];
  let dropped = 0;
  for (const s of raw) {
    if (!s || !s.anchor || !s.subject || !s.prompt) continue;
    const key = s.subject.toLowerCase().trim();
    if (seen.has(key)) continue;
    const time = resolveTime(s.anchor, stream);
    if (time == null) {
      dropped++;
      continue;
    }
    seen.add(key);
    shots.push({
      time: Math.round(time * 100) / 100,
      kind: s.kind || "concept",
      subject: s.subject.trim(),
      prompt: s.prompt.trim(),
      anchor: s.anchor,
    });
  }
  shots.sort((a, b) => a.time - b.time);

  mkdirSync(join(HERE, "shots"), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ id, shots }, null, 2) + "\n");
  console.log(
    `> wrote shots/${id}.json — ${shots.length} shots (${dropped} dropped: anchor not found)`,
  );
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  for (const s of shots) console.log(`    ${fmt(s.time).padStart(6)}  [${s.kind}] ${s.subject}`);
}

main().catch((e) => {
  console.error(`> [error]: ${e.message}`);
  process.exit(1);
});
