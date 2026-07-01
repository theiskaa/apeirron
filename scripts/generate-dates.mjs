// Generates content/node-dates.json — a committed, deploy-stable manifest of
// per-node publish/update timestamps derived from FULL git history.
//
// Why this exists: the production build (prebuild → generate-content) derives
// node dates from `git log`, but the deploy checkout is frequently shallow or
// git-less, which collapses every file's "first commit" to a single timestamp —
// making the RSS feed and node dates all read as the same moment ("just now").
// This script is run LOCALLY, where the whole history is present, and its output
// is committed. generate-content.mjs then reads the manifest as the source of
// truth, so dates survive any CI environment.
//
// Usage: `node scripts/generate-dates.mjs` (run after adding/committing nodes),
// then commit content/node-dates.json. Published dates, once recorded, are never
// regressed; nodes not yet committed are stamped with the current time so the
// newest node always sorts newest.

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const NODES_DIR = path.join(ROOT, "content", "nodes");
const OUT = path.join(ROOT, "content", "node-dates.json");

function firstCommitIso(filePath) {
  try {
    const out = execSync(
      `git log --diff-filter=A --follow --format=%cI -- "${filePath}"`,
      { stdio: ["ignore", "pipe", "ignore"] }
    )
      .toString()
      .trim();
    const lines = out.split("\n").filter(Boolean);
    return lines[lines.length - 1] ?? null; // oldest = the add commit
  } catch {
    return null;
  }
}

function lastCommitIso(filePath) {
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return iso || null;
  } catch {
    return null;
  }
}

function mtimeIso(filePath) {
  try {
    return statSync(filePath).mtime.toISOString();
  } catch {
    return null;
  }
}

// Preserve prior entries so a recorded publish date never changes and
// already-dated uncommitted nodes stay stable across runs.
let prev = {};
try {
  prev = JSON.parse(readFileSync(OUT, "utf-8"));
} catch {
  prev = {};
}

const slugs = readdirSync(NODES_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""))
  .sort();

const nowIso = new Date().toISOString();
const manifest = {};
let uncommitted = 0;

for (const slug of slugs) {
  const filePath = path.join(NODES_DIR, `${slug}.md`);
  const added = firstCommitIso(filePath);
  // Published is stable: keep whatever we recorded before; otherwise the git
  // add-date; otherwise (never committed) the file mtime or now.
  const published =
    prev[slug]?.published ?? added ?? mtimeIso(filePath) ?? nowIso;
  // Updated tracks the real last commit when available, else stays sensible.
  const updated =
    lastCommitIso(filePath) ?? prev[slug]?.updated ?? mtimeIso(filePath) ?? published;
  if (!added) uncommitted++;
  manifest[slug] = { published, updated };
}

writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Wrote ${path.relative(ROOT, OUT)}: ${slugs.length} nodes` +
    (uncommitted ? ` (${uncommitted} not yet committed → dated now/mtime)` : "")
);
