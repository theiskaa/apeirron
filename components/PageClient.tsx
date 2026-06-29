"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { GraphData, GraphNode } from "@/lib/types";
import Navbar from "./Navbar";
import TabBar, { type Tab } from "./TabBar";
import NodeView from "./NodeView";
import { type CommandAction } from "./CommandPalette";
import { useSearch } from "./SearchProvider";

const Graph = dynamic(() => import("./Graph"), { ssr: false });

const GRAPH_TAB: Tab = { id: "graph", type: "graph" };

interface Props {
  /**
   * The active node's metadata, supplied by the node-page Server Component so
   * the article renders immediately on a direct visit — before the full graph
   * (fetched client-side) arrives.
   */
  initialNode?: GraphNode;
  initialNodeId?: string;
  initialContent?: { nodeId: string; contentHtml: string };
}

export default function PageClient({
  initialNode,
  initialNodeId,
  initialContent,
}: Props) {
  // The full graph (~782KB) is static data, fetched once on mount from the
  // CDN-served /graph.json rather than serialized into the RSC payload on every
  // request. The canvas (Graph) is already client-only (ssr:false), so nothing
  // here was ever server-rendered.
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const graphFetched = useRef(false);
  useEffect(() => {
    if (graphFetched.current) return;
    graphFetched.current = true;
    let cancelled = false;
    fetch("/graph.json")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: GraphData) => {
        if (!cancelled) setGraphData(data);
      })
      .catch(() => {
        // Leave null; the graph renders a placeholder and node tabs still show
        // the active article via `initialNode` + fetched content.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const [tabs, setTabs] = useState<Tab[]>(() => {
    if (initialNodeId) {
      return [GRAPH_TAB, { id: `node:${initialNodeId}`, type: "node", nodeId: initialNodeId }];
    }
    return [GRAPH_TAB];
  });
  const [activeTabId, setActiveTabId] = useState(
    initialNodeId ? `node:${initialNodeId}` : "graph"
  );
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Per-node HTML content fetched on demand from /content/<slug>.json.
  // Seeded with `initialContent` from the Server Component (direct node-page
  // visit) so the active node renders immediately without a client fetch.
  const [contentCache, setContentCache] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    if (initialContent) m.set(initialContent.nodeId, initialContent.contentHtml);
    return m;
  });
  const [loadingIds, setLoadingIds] = useState<Set<string>>(() => new Set());
  const inFlightRef = useRef<Set<string>>(new Set());

  const ensureContentLoaded = useCallback(
    (nodeId: string) => {
      if (!nodeId) return;
      const node = graphData?.nodes.find((n) => n.id === nodeId);
      if (node?.phantom) return; // phantoms have no content file
      if (contentCache.has(nodeId)) return;
      if (inFlightRef.current.has(nodeId)) return;
      inFlightRef.current.add(nodeId);
      setLoadingIds((prev) => {
        if (prev.has(nodeId)) return prev;
        const next = new Set(prev);
        next.add(nodeId);
        return next;
      });
      fetch(`/content/${nodeId}.json`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data: { contentHtml?: string }) => {
          setContentCache((cur) => {
            if (cur.has(nodeId)) return cur;
            const next = new Map(cur);
            next.set(nodeId, data.contentHtml ?? "");
            return next;
          });
        })
        .catch(() => {
          // Leave absent; NodeView shows a minimal error state on empty content.
        })
        .finally(() => {
          inFlightRef.current.delete(nodeId);
          setLoadingIds((cur) => {
            if (!cur.has(nodeId)) return cur;
            const next = new Set(cur);
            next.delete(nodeId);
            return next;
          });
        });
    },
    [contentCache, graphData]
  );

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? GRAPH_TAB,
    [tabs, activeTabId]
  );

  const activeNode = useMemo(() => {
    if (activeTab.type !== "node" || !activeTab.nodeId) return null;
    return (
      graphData?.nodes.find((n) => n.id === activeTab.nodeId) ??
      (initialNode?.id === activeTab.nodeId ? initialNode : null)
    );
  }, [activeTab, graphData, initialNode]);

  const hasNodeTabs = tabs.some((t) => t.type === "node");

  const prevUrl = useRef(typeof window !== "undefined" ? window.location.pathname : "/");
  useEffect(() => {
    const url = activeTab.type === "node" && activeTab.nodeId
      ? `/node/${activeTab.nodeId}`
      : "/";
    if (url !== prevUrl.current) {
      window.history.pushState({ tabId: activeTabId }, "", url);
      prevUrl.current = url;
    }
  }, [activeTab, activeTabId]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/node\/(.+)$/);
      if (match) {
        const nodeId = match[1];
        const tabId = `node:${nodeId}`;
        setTabs((prev) => {
          if (prev.some((t) => t.id === tabId)) return prev;
          return [...prev, { id: tabId, type: "node", nodeId }];
        });
        setActiveTabId(tabId);
        ensureContentLoaded(nodeId);
      } else {
        setActiveTabId("graph");
      }
      prevUrl.current = path;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [ensureContentLoaded]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const tabId = `node:${nodeId}`;
      setTabs((prev) => {
        if (prev.some((t) => t.id === tabId)) return prev;
        return [...prev, { id: tabId, type: "node", nodeId }];
      });
      setActiveTabId(tabId);
      ensureContentLoaded(nodeId);
    },
    [ensureContentLoaded]
  );

  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      const next = prev.filter((t) => t.id !== tabId);
      setActiveTabId((current) => {
        if (current !== tabId) return current;
        if (idx > 0 && next[idx - 1]) return next[idx - 1].id;
        return "graph";
      });
      return next;
    });
  }, []);

  const handlePaletteSelect = useCallback(
    (nodeId: string) => {
      // Focus-on-graph only makes sense on the graph tab — that's where the
      // focus animation is implemented. On a node tab, opening the node
      // directly is what the user expects.
      if (activeTabId === "graph") {
        setFocusNodeId(nodeId);
        setTimeout(() => setFocusNodeId(null), 1000);
      } else {
        handleNodeClick(nodeId);
      }
    },
    [activeTabId, handleNodeClick]
  );

  const selectedNodeOnGraph = useMemo(() => {
    if (activeTab.type === "node") return activeTab.nodeId ?? null;
    return null;
  }, [activeTab]);

  const showGraph = activeTab.type === "graph";
  const { setNodeSelectHandler, setActionsGetter } = useSearch();

  // Commands surfaced by the palette. Built per-render from current state so
  // the visible set always reflects context (e.g. "Switch to Paths" only
  // appears when Connections is active, etc.).
  const paletteActions = useMemo<CommandAction[]>(() => {
    const acts: CommandAction[] = [];

    if (!showGraph) {
      acts.push({
        id: "cmd:return-to-graph",
        label: "Return to graph",
        hint: "Navigation",
        keywords: ["home", "graph", "main", "return", "back"],
        perform: () => setActiveTabId("graph"),
      });
    }

    if (showGraph) {
      acts.push({
        id: "cmd:open-index",
        label: "Open the index (all nodes)",
        hint: "Navigation",
        keywords: ["index", "nodes", "all", "browse", "front page", "read"],
        perform: () => {
          window.location.href = "/nodes";
        },
      });
      acts.push({
        id: "cmd:open-roadmap",
        label: "Open the roadmap (reading path)",
        hint: "Navigation",
        keywords: ["roadmap", "reading", "path", "order", "start", "zero to hero"],
        perform: () => {
          window.location.href = "/nodes?sort=roadmap";
        },
      });
    }

    return acts;
  }, [showGraph]);

  // Register the graph-aware behavior with the global search palette while this
  // view is mounted: selecting a node focuses it on the canvas (or opens a node
  // tab), and the palette surfaces the graph-specific commands. On unmount the
  // provider falls back to its universal defaults (navigate to the article).
  useEffect(() => {
    setNodeSelectHandler(handlePaletteSelect);
    return () => setNodeSelectHandler(null);
  }, [setNodeSelectHandler, handlePaletteSelect]);

  useEffect(() => {
    setActionsGetter(() => paletteActions);
    return () => setActionsGetter(null);
  }, [setActionsGetter, paletteActions]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* The graph stays mounted even while a node tab is active (hidden behind
          it via z-index, not display:none — which would zero the container
          width and re-trigger Graph's ResizeObserver / force-config effect).
          The `paused` prop halts its render loop while it's not the active tab. */}
      <div className={`absolute inset-0 ${showGraph ? "z-0" : "z-[-1] pointer-events-none"}`}>
        {graphData ? (
          <Graph
            graphData={graphData}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeOnGraph}
            focusNodeId={focusNodeId}
            paused={!showGraph}
          />
        ) : (
          // Placeholder while /graph.json loads — the canvas never SSR'd anyway.
          <div className="w-full h-full bg-graph-bg" aria-busy="true" />
        )}
      </div>

      {activeNode && !showGraph && (
        <div className="absolute inset-0 bg-background overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-background">
              <Navbar onLogoClick={() => setActiveTabId("graph")} />
              {hasNodeTabs && (
                <TabBar
                  tabs={tabs}
                  activeTabId={activeTabId}
                  nodes={graphData?.nodes ?? (initialNode ? [initialNode] : [])}
                  onSelectTab={handleSelectTab}
                  onCloseTab={handleCloseTab}
                />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <NodeView
                node={activeNode}
                contentHtml={contentCache.get(activeNode.id) ?? ""}
                loading={
                  !contentCache.has(activeNode.id) &&
                  loadingIds.has(activeNode.id)
                }
                links={graphData?.links ?? []}
                allNodes={graphData?.nodes ?? (initialNode ? [initialNode] : [])}
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>
        </div>
      )}

      {showGraph && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-background">
          <Navbar onLogoClick={() => setActiveTabId("graph")} />
          {hasNodeTabs && (
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              nodes={graphData?.nodes ?? (initialNode ? [initialNode] : [])}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
            />
          )}
        </div>
      )}

      {showGraph && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <a
            href="/nodes"
            className="chrome-surface pointer-events-auto inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12px] tracking-wide leading-none text-text-secondary hover:text-text-primary transition-colors"
            style={{ boxShadow: "var(--chrome-shadow)" }}
            aria-label="Open the index — read every node"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="14" y2="18" />
            </svg>
            <span>Read the index</span>
          </a>
        </div>
      )}
    </div>
  );
}
