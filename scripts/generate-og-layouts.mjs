/**
 * Pre-computes force-directed layouts AND exact label pixel widths for every
 * OG image, at build time.
 *
 * Two problems this solves:
 *   1. d3-force is too heavy to run per-request on Cloudflare Workers (CPU
 *      budget hangs the Worker). We bake positions here instead.
 *   2. Satori on Workers silently drops CSS centering (`justifyContent`,
 *      `textAlign`, `transform`), so text always sits at the left of its
 *      flex box. The OG route has to size each label box to match the text
 *      width exactly and position it at `left: nodeX - width/2`. To do that
 *      it needs the *real* rendered pixel width of each label — which we
 *      measure here via @napi-rs/canvas.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceCenter,
} from "d3-force";
import { createCanvas } from "@napi-rs/canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const METADATA_PATH = path.join(
  ROOT,
  "lib",
  "generated",
  "graph-metadata.json"
);
const OUT_PATH = path.join(ROOT, "lib", "generated", "og-layouts.json");

const CANVAS_W = 1200;
const PAD_X = 40;
const GRAPH_X = PAD_X;
const GRAPH_W = CANVAS_W - PAD_X * 2;
const GRAPH_H = 382;
const FOCAL_TARGET_X = GRAPH_W * 0.72;
const FOCAL_TARGET_Y = GRAPH_H * 0.32;
const MARGIN_X = 24;
const MARGIN_TOP = 22;
const MARGIN_BOTTOM = 44;

const measureCanvas = createCanvas(10, 10);
const measureCtx = measureCanvas.getContext("2d");

function measureText(text, fontSize, weight = 400) {
  // @napi-rs/canvas + "sans-serif" falls back to a default system sans font
  // whose metrics are close enough to Satori's bundled fallback. Not identical
  // — expect a few pixels of error — but close enough that labels read as
  // centered to the eye.
  measureCtx.font = `${weight} ${fontSize}px sans-serif`;
  return measureCtx.measureText(text).width;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function densityMult(n) {
  if (n > 25) return 0.7;
  if (n > 15) return 0.85;
  return 1;
}

function radiusFor(val, isFocal, mult) {
  const base = (Math.sqrt(Math.max(1, val)) * 3 + 4) * mult;
  return isFocal ? clamp(base + 2.5, 11, 20) : clamp(base, 5, 15);
}

function idHash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

function hashUnit(s, salt) {
  const h = idHash(`${s}:${salt}`);
  return (h & 0xffffff) / 0xffffff;
}

function truncateLabel(s, max) {
  if (max <= 3) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function computeLayout(focalId, focalVal, focalTitle, neighbors, subgraphLinks) {
  const dMult = densityMult(neighbors.length);
  const cx0 = GRAPH_W / 2;
  const cy0 = GRAPH_H / 2;

  const simNodes = [
    { id: focalId, val: focalVal, isFocal: true, x: cx0, y: cy0 },
    ...neighbors.map((n) => {
      const ax = hashUnit(n.id, 1);
      const ay = hashUnit(n.id, 2);
      return {
        id: n.id,
        val: n.val,
        isFocal: false,
        x: cx0 + (ax - 0.5) * 120,
        y: cy0 + (ay - 0.5) * 90,
      };
    }),
  ];

  const chargeStrength =
    neighbors.length > 25 ? -900 : neighbors.length > 15 ? -680 : -520;
  const linkDistance =
    neighbors.length > 25 ? 170 : neighbors.length > 15 ? 150 : 135;
  const collidePad = neighbors.length > 25 ? 10 : 8;

  const sim = forceSimulation(simNodes)
    .force(
      "charge",
      forceManyBody().strength(chargeStrength).distanceMax(750)
    )
    .force(
      "link",
      forceLink(subgraphLinks)
        .id((d) => d.id)
        .distance(linkDistance)
        .strength(0.12)
    )
    .force(
      "collide",
      forceCollide()
        .radius((d) => radiusFor(d.val, d.isFocal, dMult) + collidePad)
        .strength(1)
        .iterations(2)
    )
    .force("center", forceCenter(cx0, cy0).strength(0.03))
    .stop();

  for (let i = 0; i < 800; i++) sim.tick();

  const focalNode = simNodes[0];
  const bbox = () => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of simNodes) {
      const r = radiusFor(n.val, n.isFocal, dMult);
      minX = Math.min(minX, n.x - r);
      maxX = Math.max(maxX, n.x + r);
      minY = Math.min(minY, n.y - r);
      maxY = Math.max(maxY, n.y + r);
    }
    return { minX, maxX, minY, maxY };
  };

  let { minX, maxX, minY, maxY } = bbox();
  const availableW = GRAPH_W - MARGIN_X * 2;
  const availableH = GRAPH_H - MARGIN_TOP - MARGIN_BOTTOM;
  const scale = Math.min(
    1,
    availableW / (maxX - minX),
    availableH / (maxY - minY)
  );

  if (scale < 1) {
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    for (const n of simNodes) {
      n.x = cx + (n.x - cx) * scale;
      n.y = cy + (n.y - cy) * scale;
    }
    ({ minX, maxX, minY, maxY } = bbox());
  }

  const fitMinX = MARGIN_X;
  const fitMaxX = GRAPH_W - MARGIN_X;
  const fitMinY = MARGIN_TOP;
  const fitMaxY = GRAPH_H - MARGIN_BOTTOM;

  let dx = FOCAL_TARGET_X - focalNode.x;
  let dy = FOCAL_TARGET_Y - focalNode.y;

  if (minX + dx < fitMinX) dx += fitMinX - (minX + dx);
  else if (maxX + dx > fitMaxX) dx += fitMaxX - (maxX + dx);
  if (minY + dy < fitMinY) dy += fitMinY - (minY + dy);
  else if (maxY + dy > fitMaxY) dy += fitMaxY - (maxY + dy);

  for (const n of simNodes) {
    n.x += dx;
    n.y += dy;
  }

  const labelFontSize =
    neighbors.length > 25 ? 11 : neighbors.length > 15 ? 12 : 13;
  const focalLabelFontSize =
    neighbors.length > 25 ? 15 : neighbors.length > 15 ? 16 : 17;

  // Per-neighbor label with truncation + measured width. Truncation mirrors the
  // old runtime logic (based on remaining canvas edge space), but we use the
  // average char width for a rough bound — the exact width we measure afterward
  // for the truncated text is what actually gets rendered.
  const avgCharW = labelFontSize * 0.58;
  const simNodeOut = simNodes.map((n) => {
    const r = radiusFor(n.val, n.isFocal, dMult);
    const absX = GRAPH_X + n.x;
    let labelText, labelW;
    if (n.isFocal) {
      labelText = truncateLabel(focalTitle, 28);
      labelW = Math.ceil(measureText(labelText, focalLabelFontSize, 600));
    } else {
      const neighborNode = neighbors.find((x) => x.id === n.id);
      const rawTitle = neighborNode?.title ?? n.id;
      const leftSpace = absX;
      const rightSpace = CANVAS_W - absX;
      const maxChars = clamp(
        Math.floor((2 * Math.min(leftSpace, rightSpace)) / avgCharW) - 2,
        5,
        24
      );
      labelText = truncateLabel(rawTitle, maxChars);
      labelW = Math.ceil(measureText(labelText, labelFontSize));
    }
    return {
      id: n.id,
      x: Math.round(n.x * 100) / 100,
      y: Math.round(n.y * 100) / 100,
      r: Math.round(r * 100) / 100,
      label: labelText,
      labelW,
    };
  });

  return {
    dMult,
    labelFontSize,
    focalLabelFontSize,
    nodes: simNodeOut,
  };
}

function main() {
  const meta = JSON.parse(readFileSync(METADATA_PATH, "utf-8"));
  const nodes = [...meta.nodes, ...meta.phantomNodes];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const layouts = {};
  let count = 0;

  for (const node of nodes) {
    const neighborIds = new Set();
    for (const link of meta.links) {
      if (link.source === node.id) neighborIds.add(link.target);
      else if (link.target === node.id) neighborIds.add(link.source);
    }
    const neighbors = [...neighborIds]
      .map((nid) => nodeMap.get(nid))
      .filter(Boolean);
    neighbors.sort((a, b) => b.val - a.val || a.id.localeCompare(b.id));

    const included = new Set([node.id, ...neighbors.map((n) => n.id)]);
    const seenEdges = new Set();
    const subgraphLinks = [];
    for (const link of meta.links) {
      if (!included.has(link.source) || !included.has(link.target)) continue;
      const key =
        link.source < link.target
          ? `${link.source}|${link.target}`
          : `${link.target}|${link.source}`;
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      subgraphLinks.push({ source: link.source, target: link.target });
    }

    layouts[node.id] = computeLayout(
      node.id,
      node.val,
      node.title,
      neighbors,
      subgraphLinks
    );
    count++;
  }

  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(layouts));

  const bytes = Buffer.byteLength(JSON.stringify(layouts));
  console.log(
    `generate-og-layouts: ${count} layouts · ${(bytes / 1024).toFixed(1)} KB`
  );
}

main();
