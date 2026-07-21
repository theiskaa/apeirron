// Regenerate video/shorts-roadmap.md from the generation memory. Every short
// ever authored for a node lives in shorts/<node>.json; this lists them (with
// their hook) per node in reading-path order and marks which are rendered. It's
// the human-readable view of the memory that keeps re-runs from repeating an angle.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const LIB = dirname(fileURLToPath(import.meta.url));
const VIDEO = join(LIB, "..");
const REPO = join(VIDEO, "..");

export function updateRoadmap() {
  const order = JSON.parse(readFileSync(join(REPO, "content/roadmap.json"), "utf8")).path;

  const outDir = join(VIDEO, "out");
  const done = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith(".mp4")) : [];
  const rendered = (node, s) =>
    done.some((v) => v === `${node}-${s}.mp4` || v.startsWith(`${node}-${s}-`));

  const shortsDir = join(VIDEO, "shorts");
  const nodeShorts = {};
  if (existsSync(shortsDir)) {
    for (const f of readdirSync(shortsDir)) {
      if (!f.endsWith(".json")) continue;
      let d;
      try {
        d = JSON.parse(readFileSync(join(shortsDir, f), "utf8"));
      } catch {
        continue;
      }
      if (Array.isArray(d.shorts)) nodeShorts[f.slice(0, -5)] = d.shorts;
    }
  }

  let nodesStarted = 0,
    shortsRendered = 0,
    shortsTotal = 0;
  const body = [];
  for (const node of order) {
    const sh = nodeShorts[node];
    if (sh && sh.length) {
      const n = sh.filter((s) => rendered(node, s.slug)).length;
      nodesStarted++;
      shortsRendered += n;
      shortsTotal += sh.length;
      body.push(`- **${node}** — ${n}/${sh.length} rendered`);
      for (const s of sh) {
        body.push(`  - [${rendered(node, s.slug) ? "x" : " "}] ${s.title} — ${(s.hook || "").trim()}`);
      }
    } else {
      body.push(`- [ ] ${node}`);
    }
  }

  const head = [
    "# Shorts video roadmap",
    "",
    "Every short generated per node — the generation memory. Re-running a node never",
    "repeats an angle already listed here. Node order mirrors `content/roadmap.json`.",
    "Local scratch file — untracked.",
    "",
    `**Progress: ${nodesStarted} nodes started · ${shortsRendered}/${shortsTotal} shorts rendered**`,
    "",
    "Legend: `[x]` rendered · `[ ]` scripted, not rendered yet.",
    "",
  ];
  writeFileSync(join(VIDEO, "shorts-roadmap.md"), head.concat(body).join("\n") + "\n");
}
