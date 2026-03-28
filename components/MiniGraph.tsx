"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { GraphNode, GraphLink } from "@/lib/types";

interface Props {
  currentNodeId: string;
  allNodes: GraphNode[];
  allLinks: GraphLink[];
  onNodeClick: (nodeId: string) => void;
}

export default function MiniGraph({
  currentNodeId,
  allNodes,
  allLinks,
  onNodeClick,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 280, height: 360 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const hoverStartTime = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  // Responsive container sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setDims({ width: w, height: Math.max(w * 0.85, 360) });
      }
    });
    observer.observe(el);
    setDims({ width: el.clientWidth, height: Math.max(el.clientWidth * 0.85, 360) });
    return () => observer.disconnect();
  }, []);

  // BFS from current node — include all reachable nodes with depth tracking
  const subgraph = useMemo(() => {
    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

    // Only direct connections (1 level)
    const directNeighbors = new Set<string>();
    for (const link of allLinks) {
      const src = typeof link.source === "object" ? (link.source as GraphNode).id : link.source;
      const tgt = typeof link.target === "object" ? (link.target as GraphNode).id : link.target;
      if (src === currentNodeId) directNeighbors.add(tgt);
      if (tgt === currentNodeId) directNeighbors.add(src);
    }

    const includedIds = new Set([currentNodeId, ...directNeighbors]);

    const nodes = [...includedIds]
      .map((id) => {
        const n = nodeMap.get(id);
        if (!n) return null;
        const level = id === currentNodeId ? 0 : 1;
        return {
          id: n.id,
          title: n.title,
          color: n.color,
          val: id === currentNodeId ? 8 : 4,
          level,
        };
      })
      .filter(Boolean) as { id: string; title: string; color: string; val: number; level: number }[];

    const reachableIds = includedIds;
    const links = allLinks
      .filter((link) => {
        const src = typeof link.source === "object" ? (link.source as GraphNode).id : link.source;
        const tgt = typeof link.target === "object" ? (link.target as GraphNode).id : link.target;
        return reachableIds.has(src) && reachableIds.has(tgt);
      })
      .map((link) => ({
        source: typeof link.source === "object" ? (link.source as GraphNode).id : link.source,
        target: typeof link.target === "object" ? (link.target as GraphNode).id : link.target,
      }));

    return { nodes, links };
  }, [currentNodeId, allNodes, allLinks]);

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const link of subgraph.links) {
      const src = typeof link.source === "string" ? link.source : (link.source as unknown as { id: string }).id;
      const tgt = typeof link.target === "string" ? link.target : (link.target as unknown as { id: string }).id;
      if (!map.has(src)) map.set(src, new Set());
      if (!map.has(tgt)) map.set(tgt, new Set());
      map.get(src)!.add(tgt);
      map.get(tgt)!.add(src);
    }
    return map;
  }, [subgraph.links]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge").strength(-80).distanceMax(150);
    fg.d3Force("link").distance(40).strength(0.6);
    fg.d3Force("center").strength(0.15);
    setTimeout(() => fg.zoomToFit(400, 30), 300);
    setTimeout(() => fg.zoomToFit(400, 30), 1000);
  }, [subgraph]);

  const [graphBg, setGraphBg] = useState("transparent");
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      setGraphBg(s.getPropertyValue("--surface").trim() || "transparent");
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (hoveredNode === null) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    hoverStartTime.current = performance.now();
    let running = true;
    const tickle = () => {
      if (!running) return;
      fgRef.current?.refresh?.();
      if (performance.now() - hoverStartTime.current < 400) {
        animFrameRef.current = requestAnimationFrame(tickle);
      }
    };
    animFrameRef.current = requestAnimationFrame(tickle);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [hoveredNode]);

  const handleClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (node.id !== currentNodeId) {
        onNodeClick(node.id);
      }
    },
    [currentNodeId, onNodeClick]
  );

  const handleHover = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      setHoveredNode(node?.id ?? null);
    },
    []
  );

  const paintNode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isCurrent = node.id === currentNodeId;
      const isHovered = node.id === hoveredNode;
      const isNeighbor = hoveredNode !== null && neighbors.get(hoveredNode)?.has(node.id);
      const somethingHovered = hoveredNode !== null;
      const isDimmed = somethingHovered && !isHovered && !isNeighbor && !isCurrent;

      const radius = isCurrent ? 6 : node.level === 1 ? 4 : node.level === 2 ? 2.5 : 2;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      if (isDimmed) {
        ctx.fillStyle = "rgba(100,100,110,0.2)";
      } else {
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.level >= 3 && !isHovered && !isNeighbor ? 0.4 : 1;
      }
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isCurrent || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI);
        ctx.strokeStyle = isHovered ? "rgba(220,220,230,0.4)" : node.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      const fontSize = Math.min(11 / globalScale, 12);
      if (fontSize >= 1) {
        const isDark = document.documentElement.classList.contains("dark");
        ctx.font = `${isCurrent || isHovered ? "600" : "400"} ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        if (isDimmed) {
          ctx.fillStyle = isDark ? "rgba(140,140,160,0.08)" : "rgba(80,80,100,0.08)";
        } else if (isCurrent || isHovered) {
          ctx.fillStyle = isDark ? "rgba(220,220,230,0.9)" : "rgba(30,30,40,0.9)";
        } else {
          ctx.fillStyle = isDark ? "rgba(140,140,160,0.5)" : "rgba(80,80,100,0.5)";
        }
        ctx.fillText(node.title, node.x, node.y + radius + 2);
      }
    },
    [currentNodeId, hoveredNode, neighbors]
  );

  const paintNodeArea = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const radius = node.id === currentNodeId ? 6 : node.level === 1 ? 4 : 2.5;
      const hitRadius = Math.max(radius * 3, 10);
      ctx.beginPath();
      ctx.arc(node.x, node.y, hitRadius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [currentNodeId]
  );

  // Link painting with hover sweep
  const paintLink = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (link: any, ctx: CanvasRenderingContext2D) => {
      const src = typeof link.source === "object" ? link.source : { id: link.source, x: 0, y: 0 };
      const tgt = typeof link.target === "object" ? link.target : { id: link.target, x: 0, y: 0 };
      const isDark = document.documentElement.classList.contains("dark");

      const isHoveredLink =
        hoveredNode !== null && (src.id === hoveredNode || tgt.id === hoveredNode);
      const somethingHovered = hoveredNode !== null;

      if (isHoveredLink) {
        const elapsed = performance.now() - hoverStartTime.current;
        const progress = Math.min(elapsed / 250, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        const fromX = src.id === hoveredNode ? src.x : tgt.x;
        const fromY = src.id === hoveredNode ? src.y : tgt.y;
        const toX = src.id === hoveredNode ? tgt.x : src.x;
        const toY = src.id === hoveredNode ? tgt.y : src.y;

        const midX = fromX + (toX - fromX) * eased;
        const midY = fromY + (toY - fromY) * eased;

        if (eased < 1) {
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(toX, toY);
          ctx.strokeStyle = isDark ? "rgba(100,100,120,0.06)" : "rgba(100,100,120,0.04)";
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(midX, midY);
        ctx.strokeStyle = isDark
          ? `rgba(150,150,170,${0.15 + eased * 0.4})`
          : `rgba(80,80,100,${0.15 + eased * 0.35})`;
        ctx.lineWidth = 0.6 + eased * 0.4;
        ctx.stroke();
      } else if (somethingHovered) {
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = isDark ? "rgba(100,100,120,0.05)" : "rgba(100,100,120,0.03)";
        ctx.lineWidth = 0.3;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = isDark ? "rgba(100,100,120,0.2)" : "rgba(100,100,120,0.15)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    },
    [hoveredNode]
  );

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden border border-border">
      <ForceGraph2D
        ref={fgRef}
        graphData={subgraph}
        width={dims.width}
        height={dims.height}
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={paintNodeArea}
        linkCanvasObject={paintLink}
        linkCanvasObjectMode={() => "replace"}
        onNodeClick={handleClick}
        onNodeHover={handleHover}
        backgroundColor={graphBg}
        warmupTicks={0}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        nodeId="id"
        nodeVal="val"
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
      />
    </div>
  );
}
