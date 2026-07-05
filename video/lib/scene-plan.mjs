// Assemble everything the video needs for one node into a single plain-data plan,
// shared by `generate.mjs --check` (prints it) and the render (feeds it to the
// Remotion composition as inputProps). Reads only artifacts that already exist:
//
//   content/nodes/<id>.md            headings (section cards) + bold/link cues
//   public/audio-timings/<id>.json   duration + per-word [word,start,end]
//   public/audio-peaks/<id>.json     waveform peaks
//   lib/generated/graph-metadata.json title / description / category / accent color

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import matter from "gray-matter";
import { headingTokens, normalizeWord, findPhraseStart } from "./clean-heading.mjs";
import { extractCues } from "./cues.mjs";
import { detectNumbers } from "./numbers.mjs";

const VIDEO = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(VIDEO, "..");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

// Must match image.py _slug() and generate.mjs slugify().
const slug = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Generic nouns the shot subjects tack on ("... Structure", "... Concept") — cut
// them so a derived label reads as a title, not a description.
const GENERIC =
  /\b(concept|scene|illustration|structure|view|design|system|diagram|vision|scenario|classification|conditions|policy|question|breakdown|results?|data|chart)s?\b/gi;

// Fall back to a short on-screen caption when a shot has no LLM `label` (shot
// lists authored before the label field). For a person, keep just the name (drop
// "... at Fuller Lodge", "... and His Equation"); otherwise the first couple of
// meaningful words.
function shortLabel(subject, kind) {
  if (kind === "person") {
    const name = subject.split(/\s+(?:and|on|at|of|in|for|with|his|her)\s+/i)[0];
    return name.split(/\s+/).slice(0, 3).join(" ");
  }
  const s = subject.replace(GENERIC, "").replace(/\s+/g, " ").trim();
  return (s || subject).split(/\s+/).slice(0, 3).join(" ");
}

// Load the LLM-authored shot list (video/shots/<id>.json) and resolve each shot's
// plate: asset is set only once its PNG exists in public/plates/, so the video
// shows a shot only when it has been generated.
function loadShots(id) {
  const p = join(VIDEO, "shots", `${id}.json`);
  if (!existsSync(p)) return [];
  return (readJson(p).shots || []).map((s) => {
    const rel = `plates/${slug(s.subject)}.png`;
    // Short on-screen caption. Prefer the LLM's `label`; otherwise derive one.
    const label = s.label || shortLabel(s.subject, s.kind);
    return {
      time: s.time,
      kind: s.kind,
      subject: s.subject,
      label,
      asset: existsSync(join(VIDEO, "public", rel)) ? rel : null,
    };
  });
}

function nodeMeta(id, md) {
  const meta = readJson(join(REPO, "lib/generated/graph-metadata.json"));
  const found = meta.nodes.find((n) => n.id === id);
  if (found) {
    return {
      title: found.title,
      description: found.description || "",
      category: found.category,
      color: found.color,
    };
  }
  // Fallback for a node not yet in the generated metadata: read frontmatter.
  const fm = matter(md).data;
  const cat = meta.categories.find((c) => c.id === fm.category);
  return {
    title: fm.title || id,
    description: fm.description || "",
    category: fm.category || "cosmos",
    color: (cat && cat.color) || "#6790b5",
  };
}

// Match each `##`/`###` heading against the spoken stream (monotonically, since
// headings and audio share document order) to get its exact start second.
function alignSections(md, words) {
  const body = md
    .replace(/^\s*---\s*\n[\s\S]*?\n---\s*\n/, "")
    .replace(/\n#{1,6}\s*Sources\b[\s\S]*$/i, "");
  const headings = [...body.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((m) =>
    m[2].trim(),
  );
  const stream = words.map(([w, s]) => ({ norm: normalizeWord(w), start: s }));

  const sections = [];
  let ptr = 0;
  for (const title of headings) {
    const toks = headingTokens(title);
    if (!toks.length) continue;
    const i = findPhraseStart(stream, toks, ptr);
    if (i >= 0) {
      sections.push({ title, start: stream[i].start });
      ptr = i + 1; // headings share document order — never rematch earlier audio
    }
  }
  return sections;
}

// The node's connections as label+color pairs (for the "Connects to" card) —
// straight from the graph metadata; no layout/graph build needed.
function loadConnections(id) {
  const meta = readJson(join(REPO, "lib/generated/graph-metadata.json"));
  const focal = meta.nodes.find((n) => n.id === id);
  if (!focal) return null;
  const byId = new Map(meta.nodes.map((n) => [n.id, n]));
  const targets = {};
  for (const c of focal.connections || []) {
    const t = byId.get(c.target);
    if (t) targets[c.target] = { label: t.title, color: t.color };
  }
  return { focal: { label: focal.title, color: focal.color }, targets };
}

export function buildScenePlan(id) {
  const mdPath = join(REPO, "content/nodes", `${id}.md`);
  if (!existsSync(mdPath)) throw new Error(`no node markdown at ${mdPath}`);

  const timingsPath = join(REPO, "public/audio-timings", `${id}.json`);
  if (!existsSync(timingsPath)) {
    throw new Error(
      `no timings at ${timingsPath} — narrate the node first (see speech/).`,
    );
  }

  const md = readFileSync(mdPath, "utf8");
  const timings = readJson(timingsPath);
  const words = timings.words || [];

  const peaksPath = join(REPO, "public/audio-peaks", `${id}.json`);
  const peaks = existsSync(peaksPath) ? readJson(peaksPath).peaks || [] : [];

  return {
    id,
    ...nodeMeta(id, md),
    duration: timings.duration,
    sections: alignSections(md, words),
    cues: extractCues(md, words),
    shots: loadShots(id),
    numbers: detectNumbers(words),
    connections: loadConnections(id),
    words,
    peaks,
  };
}
