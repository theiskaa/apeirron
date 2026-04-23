import { ImageResponse } from "next/og";
import {
  buildGraphData,
  getCategories,
  getPhantomNodeIds,
} from "@/lib/content";
import ogLayouts from "@/lib/generated/og-layouts.json";

export const alt = "Apeirron — Biggest questions humanity asks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graph = await buildGraphData();
  const node = graph.nodes.find((n) => n.id === id);
  return [
    {
      id: "default",
      alt: node ? `${node.title} — Apeirron` : alt,
      contentType,
      size,
    },
  ];
}

interface Props {
  params: Promise<{ id: string }>;
}

const CANVAS_W = 1200;
const CANVAS_H = 630;
const GRID = 40;

const BG = "#f8f8fa";
const GRID_COLOR = "rgba(0, 0, 0, 0.055)";
const LINE_COLOR = "rgba(100, 100, 120, 0.3)";
const LABEL_COLOR = "rgba(40, 40, 50, 0.62)";
const FOCAL_LABEL_COLOR = "rgba(20, 20, 30, 0.92)";
const TITLE_COLOR = "#1a1a1e";
const CATEGORY_TEXT_COLOR = "#5a5a6e";
const RING_COLOR = "rgba(40, 40, 50, 0.3)";
const PHANTOM_RING_COLOR = "rgba(40, 40, 50, 0.35)";

const PAD_X = 40;
const PAD_TOP = 28;
const PAD_BOTTOM = 32;
const CATEGORY_H = 26;
const CATEGORY_GAP = 6;
const TITLE_AREA_H = 104;
const TITLE_GAP = 8;

const GRAPH_X = PAD_X;
const GRAPH_Y = PAD_TOP + CATEGORY_H + CATEGORY_GAP;
const GRAPH_W = CANVAS_W - PAD_X * 2;
const GRAPH_H =
  CANVAS_H -
  PAD_TOP -
  CATEGORY_H -
  CATEGORY_GAP -
  TITLE_GAP -
  TITLE_AREA_H -
  PAD_BOTTOM;

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  r: number;
  label: string;
  labelW: number;
}
interface Layout {
  dMult: number;
  labelFontSize: number;
  focalLabelFontSize: number;
  nodes: LayoutNode[];
}

const layouts = ogLayouts as unknown as Record<string, Layout>;

function truncateLabel(s: string, max: number): string {
  if (max <= 3) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default async function OpenGraphImage({ params }: Props) {
  const { id } = await params;
  const graph = await buildGraphData();
  const categories = getCategories();
  const node = graph.nodes.find((n) => n.id === id);

  let title: string;
  let categoryLabel: string;
  let categoryColor = "#888888";
  let focalColor = "#888888";
  let focalIsPhantom = false;

  if (node) {
    title = node.title;
    const cat = categories.find((c) => c.id === node.category);
    categoryLabel = cat?.label ?? node.category;
    categoryColor = cat?.color ?? categoryColor;
    focalColor = node.color;
    focalIsPhantom = !!node.phantom;
  } else {
    const phantomIds = getPhantomNodeIds();
    if (phantomIds.includes(id)) {
      title = id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      categoryLabel = "Proposed";
    } else {
      title = "Apeirron";
      categoryLabel = "Knowledge Graph";
    }
  }

  const layout = layouts[id];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  const labelFontSize = layout?.labelFontSize ?? 13;
  const focalLabelFontSize = layout?.focalLabelFontSize ?? 17;

  type RenderNode = {
    id: string;
    x: number;
    y: number;
    r: number;
    color: string;
    phantom?: boolean;
    isFocal: boolean;
    label: string;
    labelW: number;
  };

  const renderNodes: RenderNode[] = [];

  if (layout) {
    for (const ln of layout.nodes) {
      const isFocal = ln.id === id;
      const n = nodeMap.get(ln.id);
      renderNodes.push({
        id: ln.id,
        x: ln.x,
        y: ln.y,
        r: ln.r,
        color: isFocal ? focalColor : n?.color ?? "#888888",
        phantom: isFocal ? focalIsPhantom : n?.phantom,
        isFocal,
        label: ln.label,
        labelW: ln.labelW,
      });
    }
  } else {
    renderNodes.push({
      id,
      x: GRAPH_W * 0.5,
      y: GRAPH_H * 0.5,
      r: 16,
      color: focalColor,
      phantom: focalIsPhantom,
      isFocal: true,
      label: truncateLabel(title, 28),
      labelW: Math.ceil(title.length * focalLabelFontSize * 0.58),
    });
  }

  const posMap = new Map(renderNodes.map((n) => [n.id, n]));
  const focalNode = renderNodes.find((n) => n.isFocal)!;
  const neighborSim = renderNodes.filter((n) => !n.isFocal);

  const renderLinks: { source: string; target: string }[] = [];
  if (layout) {
    const included = new Set(layout.nodes.map((n) => n.id));
    const seen = new Set<string>();
    for (const link of graph.links) {
      if (!included.has(link.source) || !included.has(link.target)) continue;
      const key =
        link.source < link.target
          ? `${link.source}|${link.target}`
          : `${link.target}|${link.source}`;
      if (seen.has(key)) continue;
      seen.add(key);
      renderLinks.push({ source: link.source, target: link.target });
    }
  }

  const gridVerticals: number[] = [];
  for (let x = 0; x <= CANVAS_W; x += GRID) gridVerticals.push(x);
  const gridHorizontals: number[] = [];
  for (let y = 0; y <= CANVAS_H; y += GRID) gridHorizontals.push(y);

  const titleSize = title.length > 36 ? 52 : title.length > 22 ? 64 : 80;

  return new ImageResponse(
    (
      <div
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          display: "flex",
          position: "relative",
          background: BG,
          fontFamily: "sans-serif",
          color: TITLE_COLOR,
        }}
      >
        <svg
          style={{ position: "absolute", top: 0, left: 0 }}
          width={CANVAS_W}
          height={CANVAS_H}
        >
          {gridVerticals.map((x) => (
            <line
              key={`gv-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={CANVAS_H}
              stroke={GRID_COLOR}
              strokeWidth={1}
            />
          ))}
          {gridHorizontals.map((y) => (
            <line
              key={`gh-${y}`}
              x1={0}
              y1={y}
              x2={CANVAS_W}
              y2={y}
              stroke={GRID_COLOR}
              strokeWidth={1}
            />
          ))}

          {renderLinks.map((link, i) => {
            const s = posMap.get(link.source);
            const t = posMap.get(link.target);
            if (!s || !t) return null;
            return (
              <line
                key={`e-${i}`}
                x1={GRAPH_X + s.x}
                y1={GRAPH_Y + s.y}
                x2={GRAPH_X + t.x}
                y2={GRAPH_Y + t.y}
                stroke={LINE_COLOR}
                strokeWidth={1}
              />
            );
          })}

          {neighborSim.map((n, i) => (
            <g key={`n-${i}`}>
              {n.phantom && (
                <circle
                  cx={GRAPH_X + n.x}
                  cy={GRAPH_Y + n.y}
                  r={n.r + 1.5}
                  fill="none"
                  stroke={PHANTOM_RING_COLOR}
                  strokeDasharray="2 2"
                  strokeWidth={0.8}
                />
              )}
              <circle
                cx={GRAPH_X + n.x}
                cy={GRAPH_Y + n.y}
                r={n.r}
                fill={n.color}
                fillOpacity={n.phantom ? 0.55 : 1}
              />
            </g>
          ))}

          <g>
            <circle
              cx={GRAPH_X + focalNode.x}
              cy={GRAPH_Y + focalNode.y}
              r={focalNode.r + 3.5}
              fill="none"
              stroke={RING_COLOR}
              strokeWidth={1.3}
            />
            {focalIsPhantom && (
              <circle
                cx={GRAPH_X + focalNode.x}
                cy={GRAPH_Y + focalNode.y}
                r={focalNode.r + 1.8}
                fill="none"
                stroke={PHANTOM_RING_COLOR}
                strokeDasharray="2 2"
                strokeWidth={0.9}
              />
            )}
            <circle
              cx={GRAPH_X + focalNode.x}
              cy={GRAPH_Y + focalNode.y}
              r={focalNode.r}
              fill={focalColor}
              fillOpacity={focalIsPhantom ? 0.6 : 1}
            />
          </g>
        </svg>

        {neighborSim.map((n, i) => {
          const absX = GRAPH_X + n.x;
          const absY = GRAPH_Y + n.y + n.r + 4;
          return (
            <div
              key={`l-${i}`}
              style={{
                position: "absolute",
                display: "flex",
                top: absY,
                left: absX - n.labelW / 2,
                width: n.labelW,
                fontSize: labelFontSize,
                color: LABEL_COLOR,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
              }}
            >
              {n.label}
            </div>
          );
        })}

        {(() => {
          const absX = GRAPH_X + focalNode.x;
          const absY = GRAPH_Y + focalNode.y + focalNode.r + 6;
          return (
            <div
              style={{
                position: "absolute",
                display: "flex",
                top: absY,
                left: absX - focalNode.labelW / 2,
                width: focalNode.labelW,
                fontSize: focalLabelFontSize,
                fontWeight: 600,
                color: FOCAL_LABEL_COLOR,
                whiteSpace: "nowrap",
              }}
            >
              {focalNode.label}
            </div>
          );
        })()}

        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            gap: 14,
            top: PAD_TOP,
            left: PAD_X,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: categoryColor,
            }}
          />
          <div
            style={{
              fontSize: 20,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: CATEGORY_TEXT_COLOR,
              fontWeight: 500,
            }}
          >
            {categoryLabel}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            display: "flex",
            left: PAD_X,
            right: PAD_X,
            bottom: PAD_BOTTOM,
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            color: TITLE_COLOR,
          }}
        >
          {title}
        </div>
      </div>
    ),
    size
  );
}
