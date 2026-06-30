"use client";

import { useEffect, useRef, useState } from "react";
import type { GraphNode } from "@/lib/types";
import { headerColumnClass } from "./Navbar";

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
  /** Match the navbar's expanded/compact width + animation (see Navbar). */
  articleInset?: boolean;
}

export default function TabBar({
  tabs,
  activeTabId,
  nodes,
  onSelectTab,
  onCloseTab,
  articleInset,
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

  // Fade the edges only when the row actually overflows — otherwise a couple of
  // tabs start flush at the navbar's left with no faux padding.
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

  // Soft-fade BOTH edges so tabs blend out instead of hard-cutting. (Only the
  // extra layout padding is right-only; the left keeps its fade, just no push.)
  const fadeMask =
    "linear-gradient(to right, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%)";

  return (
    <div className="pt-3 pb-2">
      <div className={headerColumnClass(articleInset)}>
        {/* Scroll viewport. Tabs start flush at the column's left (where the
            navbar starts) and scroll from there. Edges only fade when the row
            overflows, so a few tabs aren't pushed in or clipped. */}
        <div
          ref={scrollRef}
          className="pointer-events-auto overflow-x-auto no-scrollbar"
          style={{
            scrollPaddingInline: "36px",
            ...(overflowing
              ? { maskImage: fadeMask, WebkitMaskImage: fadeMask }
              : {}),
          }}
        >
          <div
            role="tablist"
            aria-label="Open tabs"
            // Left edge stays snug/aligned; only the RIGHT gets extra padding
            // (past the fade) so the last/newest tab is fully visible.
            className={`flex items-center gap-1.5 w-max ${
              overflowing ? "pl-2 pr-8" : "px-2"
            }`}
          >
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isGraph = tab.type === "graph";
              const node =
                tab.type === "node" ? nodeMap.get(tab.nodeId!) : null;

              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeRef : undefined}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={
                    isGraph ? "Graph view" : (node?.title ?? "Unknown node")
                  }
                  onClick={() => onSelectTab(tab.id)}
                  className={`tab group h-7 inline-flex items-center justify-center gap-1.5 px-3.5 text-[12px] leading-none rounded-full shrink-0 text-text-muted hover:text-text-secondary aria-selected:text-text-primary ${
                    isActive ? "max-w-[440px]" : "max-w-[180px]"
                  }`}
                  style={
                    {
                      "--tc": isGraph
                        ? "var(--text-muted)"
                        : (node?.color ?? "#666"),
                    } as React.CSSProperties
                  }
                >
                  <span className={isActive ? "whitespace-nowrap" : "truncate"}>
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
                      className={`shrink-0 w-4 h-4 rounded-full inline-flex items-center justify-center
                  hover:bg-text-primary/10 hover:text-text-primary
                  transition-opacity duration-[120ms]
                  ${
                    isActive
                      ? "opacity-50 hover:opacity-100 ml-0.5"
                      : "opacity-0 group-hover:opacity-50 group-hover:ml-0.5 hover:!opacity-100"
                  }
                `}
                    >
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
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
      </div>
    </div>
  );
}
