"use client";

import { useEffect, useRef, useState } from "react";
import type { GraphNode } from "@/lib/types";

export interface Tab {
  id: string;
  type: "graph" | "node";
  nodeId?: string;
}

interface Props {
  tabs: Tab[];
  activeTabId: string;
  nodes: GraphNode[];
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  nodes,
  onSelectTab,
  onCloseTab,
}: Props) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Keep the active tab in view — a newly opened tab is appended on the right
  // and would otherwise be off-screen once the list overflows. scroll-padding
  // (set on the viewport) keeps it clear of the faded edge.
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeTabId, tabs.length]);

  // Fade the edges only when the row actually overflows, so a couple of tabs
  // sit flush against the navbar divider instead of being faded or pushed in.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tabs.length, activeTabId]);

  const fadeMask =
    "linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%)";

  return (
    <div
      ref={scrollRef}
      className="min-w-0 overflow-x-auto no-scrollbar"
      style={{
        scrollPaddingInline: "20px",
        ...(overflowing ? { maskImage: fadeMask, WebkitMaskImage: fadeMask } : {}),
      }}
    >
      <div
        role="tablist"
        aria-label="Open tabs"
        className={`flex items-center w-max ${overflowing ? "px-3" : ""}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isGraph = tab.type === "graph";
          const node = tab.type === "node" ? nodeMap.get(tab.nodeId!) : null;

          return (
            <button
              key={tab.id}
              ref={isActive ? activeRef : undefined}
              role="tab"
              aria-selected={isActive}
              aria-label={isGraph ? "Graph view" : (node?.title ?? "Unknown node")}
              onClick={() => onSelectTab(tab.id)}
              className={`tab group relative h-8 inline-flex items-center gap-1 px-2 text-[12px] leading-none shrink-0 ${
                isActive ? "max-w-[260px]" : "max-w-[160px]"
              }`}
              style={
                {
                  "--tc": isGraph ? "var(--text-primary)" : (node?.color ?? "#666"),
                } as React.CSSProperties
              }
            >
              <span className="truncate">
                {isGraph ? "Graph" : (node?.title ?? "Unknown")}
              </span>

              {!isGraph && (
                <span
                  role="button"
                  aria-label={`Close ${node?.title ?? "tab"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  // Inactive tabs reserve no room for the close button until
                  // hovered, so idle tabs sit evenly spaced.
                  className={`shrink-0 h-4 -mr-1 rounded-full inline-flex items-center justify-center overflow-hidden hover:bg-text-primary/10 hover:text-text-primary transition-opacity duration-[120ms] ${
                    isActive
                      ? "w-4 opacity-50 hover:opacity-100"
                      : "w-0 opacity-0 group-hover:w-4 group-hover:opacity-50 hover:!opacity-100"
                  }`}
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    className="block"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
