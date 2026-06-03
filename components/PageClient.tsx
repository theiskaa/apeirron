"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { GraphData } from "@/lib/types";
import Navbar from "./Navbar";
import TabBar, { type Tab } from "./TabBar";
import NodeView, { type MiniView } from "./NodeView";
import CommandPalette, { type CommandAction } from "./CommandPalette";
import ViewModeToggle, { type ViewMode } from "./ViewModeToggle";

const Graph = dynamic(() => import("./Graph"), { ssr: false });
const PathsGraph = dynamic(() => import("./PathsGraph"), { ssr: false });

const VIEW_MODE_STORAGE_KEY = "apeirron-view-mode";
const MINI_VIEW_STORAGE_KEY = "apeirron-node-mini-view";

// Paths are temporarily hidden from the main canvas. The Paths reading-flow now
// lives on the newspaper-style index page (/nodes); the path data, PathsGraph
// component, and per-node mini-path diagram all remain. Flip to `true` to bring
// the on-canvas Connections/Paths toggle back.
const SHOW_PATHS_ON_CANVAS = false;

const GRAPH_TAB: Tab = { id: "graph", type: "graph" };

interface Props {
  graphData: GraphData;
  initialNodeId?: string;
  initialContent?: { nodeId: string; contentHtml: string };
}

export default function PageClient({
  graphData,
  initialNodeId,
  initialContent,
}: Props) {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    if (initialNodeId) {
      return [GRAPH_TAB, { id: `node:${initialNodeId}`, type: "node", nodeId: initialNodeId }];
    }
    return [GRAPH_TAB];
  });
  const [activeTabId, setActiveTabId] = useState(
    initialNodeId ? `node:${initialNodeId}` : "graph"
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("connections");
  const [miniView, setMiniView] = useState<MiniView>("graph");

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
      const node = graphData.nodes.find((n) => n.id === nodeId);
      if (!node || node.phantom) return; // phantoms have no content file
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
    [contentCache, graphData.nodes]
  );

  useEffect(() => {
    try {
      const savedView = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (
        savedView === "connections" ||
        (savedView === "paths" && SHOW_PATHS_ON_CANVAS)
      ) {
        setViewMode(savedView);
      }
      const savedMini = localStorage.getItem(MINI_VIEW_STORAGE_KEY);
      if (savedMini === "graph" || savedMini === "path") {
        setMiniView(savedMini);
      }
    } catch {}
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {}
  }, []);

  const handleMiniViewChange = useCallback((v: MiniView) => {
    setMiniView(v);
    try {
      localStorage.setItem(MINI_VIEW_STORAGE_KEY, v);
    } catch {}
  }, []);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? GRAPH_TAB,
    [tabs, activeTabId]
  );

  const activeNode = useMemo(() => {
    if (activeTab.type !== "node" || !activeTab.nodeId) return null;
    return graphData.nodes.find((n) => n.id === activeTab.nodeId) ?? null;
  }, [activeTab, graphData.nodes]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      // Focus-on-graph only makes sense in the connections viewMode — that's
      // where the focus animation is implemented. On paths (or any node tab),
      // opening the node directly is what the user expects.
      const onConnectionsGraph =
        activeTabId === "graph" && viewMode === "connections";
      if (onConnectionsGraph) {
        setFocusNodeId(nodeId);
        setTimeout(() => setFocusNodeId(null), 1000);
      } else {
        handleNodeClick(nodeId);
      }
    },
    [activeTabId, viewMode, handleNodeClick]
  );

  const selectedNodeOnGraph = useMemo(() => {
    if (activeTab.type === "node") return activeTab.nodeId ?? null;
    return null;
  }, [activeTab]);

  const showGraph = activeTab.type === "graph";
  const openSearch = useCallback(() => setPaletteOpen(true), []);

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
      if (SHOW_PATHS_ON_CANVAS) {
        if (viewMode !== "connections") {
          acts.push({
            id: "cmd:view-connections",
            label: "Switch to Connections view",
            hint: "View",
            keywords: ["connections", "graph", "switch", "view"],
            perform: () => handleViewModeChange("connections"),
          });
        }
        if (viewMode !== "paths") {
          acts.push({
            id: "cmd:view-paths",
            label: "Switch to Paths view",
            hint: "View",
            keywords: ["paths", "diagram", "diagrams", "switch", "view"],
            perform: () => handleViewModeChange("paths"),
          });
        }
      }
      acts.push({
        id: "cmd:open-index",
        label: "Open the index (all nodes)",
        hint: "Navigation",
        keywords: ["index", "nodes", "all", "browse", "front page", "read"],
        perform: () => {
          window.location.href = "/nodes";
        },
      });
    } else if (activeTab.type === "node") {
      if (miniView !== "graph") {
        acts.push({
          id: "cmd:mini-graph",
          label: "Side panel: Connections",
          hint: "View",
          keywords: ["mini", "side", "panel", "connections", "graph"],
          perform: () => handleMiniViewChange("graph"),
        });
      }
      if (miniView !== "path") {
        acts.push({
          id: "cmd:mini-path",
          label: "Side panel: Path diagram",
          hint: "View",
          keywords: ["mini", "side", "panel", "path", "diagram"],
          perform: () => handleMiniViewChange("path"),
        });
      }
    }

    return acts;
  }, [
    showGraph,
    viewMode,
    miniView,
    activeTab.type,
    handleViewModeChange,
    handleMiniViewChange,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Both graphs stay mounted; the inactive one is hidden via opacity
          (not display:none, which would zero the container width and
          re-trigger Graph's ResizeObserver / force-config effect). Each
          receives a `paused` prop so its render loop halts while hidden. */}
      <div className={`absolute inset-0 ${showGraph ? "z-0" : "z-[-1] pointer-events-none"}`}>
        <div
          className={`absolute inset-0 transition-opacity duration-150 ${
            viewMode === "connections" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Graph
            graphData={graphData}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeOnGraph}
            focusNodeId={focusNodeId}
            paused={viewMode !== "connections" || !showGraph}
          />
        </div>
        {SHOW_PATHS_ON_CANVAS && (
          <div
            className={`absolute inset-0 transition-opacity duration-150 ${
              viewMode === "paths" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <PathsGraph
              graphData={graphData}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNodeOnGraph}
              focusNodeId={focusNodeId}
              paused={viewMode !== "paths" || !showGraph}
            />
          </div>
        )}
      </div>

      {activeNode && !showGraph && (
        <div className="absolute inset-0 bg-background overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-background">
              <Navbar onLogoClick={() => setActiveTabId("graph")} onSearchClick={openSearch} />
              {hasNodeTabs && (
                <TabBar
                  tabs={tabs}
                  activeTabId={activeTabId}
                  nodes={graphData.nodes}
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
                links={graphData.links}
                allNodes={graphData.nodes}
                onNodeClick={handleNodeClick}
                miniView={miniView}
                onMiniViewChange={handleMiniViewChange}
              />
            </div>
          </div>
        </div>
      )}

      {showGraph && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-background">
          <Navbar onLogoClick={() => setActiveTabId("graph")} onSearchClick={openSearch} />
          {hasNodeTabs && (
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              nodes={graphData.nodes}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
            />
          )}
        </div>
      )}

      {showGraph && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          {SHOW_PATHS_ON_CANVAS ? (
            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
          ) : (
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
          )}
        </div>
      )}

      <CommandPalette
        nodes={graphData.nodes}
        actions={paletteActions}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectNode={handlePaletteSelect}
      />
    </div>
  );
}
