// Build a node's local neighborhood for the on-screen graph, reusing the exact
// layout the site precomputes for its OG images (lib/generated/og-layouts.json):
// the focal node plus its direct connections, already force-laid-out with x/y/r.
// We only re-attach per-node colours and titles from the graph metadata and add
// the focal→neighbour edges (every non-focal node in a node's layout IS one of
// its connections). Positions are in the OG canvas space; GraphView normalizes.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

export function buildNeighborhood(id) {
  const layoutsPath = join(REPO, "lib/generated/og-layouts.json");
  if (!existsSync(layoutsPath)) return null;
  const layout = readJson(layoutsPath)[id];
  if (!layout || !layout.nodes || layout.nodes.length < 2) return null;

  const meta = readJson(join(REPO, "lib/generated/graph-metadata.json"));
  const color = new Map(meta.nodes.map((n) => [n.id, n.color]));
  const title = new Map(meta.nodes.map((n) => [n.id, n.title]));

  const nodes = layout.nodes.map((n) => ({
    id: n.id,
    x: n.x,
    y: n.y,
    r: n.r,
    label: title.get(n.id) || n.label,
    color: color.get(n.id) || "#888888",
    focal: n.id === id,
  }));

  // The focal node is the first entry; edges radiate from it to each neighbour.
  const focal = nodes[0].id;
  const edges = nodes.slice(1).map((n) => ({ from: focal, to: n.id }));

  return { nodes, edges };
}
