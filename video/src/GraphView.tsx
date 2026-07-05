import React from "react";
import { COLORS } from "./theme.mjs";

export interface GNode {
  id: string;
  x: number;
  y: number;
  r: number;
  label: string;
  color: string;
  focal: boolean;
}
export interface Graph {
  nodes: GNode[];
  edges: { from: string; to: string }[];
}

// Renders a node's neighborhood (from lib/graph.mjs) into a box of the given
// size. The layout coordinates come from the site's precomputed OG layout, so we
// just normalize them to fit and draw. `progress` (0→1) staggers the reveal;
// `highlightId` lifts one neighbour (used when its [[wikilink]] is spoken);
// `labels` picks which node names to show.
export const GraphView: React.FC<{
  graph: Graph;
  width: number;
  height: number;
  fontFamily: string;
  progress?: number;
  highlightId?: string | null;
  labels?: "all" | "focal" | "highlight" | "none";
}> = ({
  graph,
  width,
  height,
  fontFamily,
  progress = 1,
  highlightId = null,
  labels = "all",
}) => {
  const pad = 60;
  const xs = graph.nodes.map((n) => n.x);
  const ys = graph.nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(
    (width - pad * 2) / Math.max(1, maxX - minX),
    (height - pad * 2) / Math.max(1, maxY - minY),
  );
  const offX = (width - (maxX - minX) * scale) / 2 - minX * scale;
  const offY = (height - (maxY - minY) * scale) / 2 - minY * scale;
  const P = (n: GNode) => ({ cx: n.x * scale + offX, cy: n.y * scale + offY });
  const pos = new Map(graph.nodes.map((n) => [n.id, P(n)]));

  // Per-node reveal: focal first, neighbours stagger in after.
  const nodeIn = (i: number) => {
    const t = (progress - i * 0.06) / 0.25;
    return Math.max(0, Math.min(1, t));
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      {graph.edges.map((e, i) => {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) return null;
        const lit = highlightId === e.to || highlightId === e.from;
        return (
          <line
            key={i}
            x1={a.cx}
            y1={a.cy}
            x2={b.cx}
            y2={b.cy}
            stroke={lit ? COLORS.textSecondary : COLORS.border}
            strokeWidth={lit ? 2.5 : 1.5}
            opacity={Math.min(1, progress * 1.5) * (lit ? 0.9 : 0.5)}
          />
        );
      })}
      {graph.nodes.map((n, i) => {
        const p = pos.get(n.id)!;
        const t = nodeIn(i);
        if (t <= 0) return null;
        const hl = highlightId === n.id;
        const rad = (n.focal ? 15 : 11) * (hl ? 1.35 : 1);
        const showLabel =
          labels === "all" ||
          (labels === "focal" && n.focal) ||
          (labels === "highlight" && (hl || n.focal));
        return (
          <g key={n.id} opacity={t} transform={`translate(${p.cx} ${p.cy})`}>
            {(hl || n.focal) && (
              <circle r={rad + 8} fill="none" stroke={n.color} strokeWidth={2} opacity={0.35} />
            )}
            <circle r={rad * t} fill={n.color} />
            {showLabel && (
              <text
                x={0}
                y={rad + 26}
                textAnchor="middle"
                fill={hl || n.focal ? COLORS.textPrimary : COLORS.textMuted}
                style={{
                  fontFamily,
                  fontSize: n.focal ? 26 : 21,
                  fontWeight: n.focal ? 600 : 400,
                }}
              >
                {n.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
