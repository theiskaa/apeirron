import roadmap from "@/content/roadmap.json";

/**
 * The curated "zero to hero" reading path — an ordered list of node ids,
 * authored in content/roadmap.json. This is the single source of truth for
 * roadmap ordering, shared by the /nodes index ("Roadmap" sort) and the
 * per-node "Read next" suggestion so the two always agree.
 */
export const ROADMAP_PATH: string[] = roadmap.path;

export interface RoadmapOrderInput {
  id: string;
  /** Connectivity weight (graph degree) — orders nodes beyond the curated path. */
  weight: number;
}

export interface RoadmapOrder {
  /** Full ordering over every supplied node id. */
  order: string[];
  /** How many leading entries come from the curated path (the rest are the tail). */
  curatedCount: number;
}

/**
 * Build the full roadmap ordering over a set of nodes: the curated path first
 * (authored order, existing ids only, de-duplicated), then every remaining node
 * by descending connectivity, with id as a stable tiebreak. Deterministic, so
 * server (index page) and client (Read next) produce identical sequences.
 */
export function buildRoadmapOrder(items: RoadmapOrderInput[]): RoadmapOrder {
  const present = new Set(items.map((i) => i.id));
  const seen = new Set<string>();
  const order: string[] = [];

  for (const id of ROADMAP_PATH) {
    if (present.has(id) && !seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }
  const curatedCount = order.length;

  const rest = items
    .filter((i) => !seen.has(i.id))
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
  for (const i of rest) order.push(i.id);

  return { order, curatedCount };
}
