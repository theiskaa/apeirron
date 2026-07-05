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
import { buildNeighborhood } from "./graph.mjs";
import { detectNumbers } from "./numbers.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

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
    numbers: detectNumbers(words),
    graph: buildNeighborhood(id),
    words,
    peaks,
  };
}
