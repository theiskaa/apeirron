"use client";

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

  return (
    <div
      role="tablist"
      aria-label="Open tabs"
      className="relative z-10 flex items-center gap-1.5 px-4 md:px-8 py-2 overflow-x-auto no-scrollbar"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isGraph = tab.type === "graph";
        const node = tab.type === "node" ? nodeMap.get(tab.nodeId!) : null;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={isGraph ? "Graph view" : node?.title ?? "Unknown node"}
            onClick={() => onSelectTab(tab.id)}
            className={`group h-7 inline-flex items-center gap-1.5 px-3 text-[12px] rounded-full shrink-0 transition-colors duration-[120ms]
              ${isActive
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
              }
              ${isActive ? "" : "max-w-[160px]"}
            `}
            style={
              isActive
                ? isGraph
                  ? {
                      backgroundColor: "var(--chrome-fill-active)",
                      boxShadow: "inset 0 0 0 1px var(--border-strong)",
                    }
                  : {
                      backgroundColor: `${node?.color ?? "#666"}14`,
                      boxShadow: `inset 0 0 0 1px ${node?.color ?? "#666"}33`,
                    }
                : undefined
            }
          >
            {isGraph ? (
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="shrink-0 opacity-60"
              >
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <circle cx="18" cy="6" r="3" />
                <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" />
                <line x1="8.5" y1="6" x2="15.5" y2="6" />
              </svg>
            ) : (
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ backgroundColor: node?.color ?? "#666" }}
              />
            )}

            <span className={isActive ? "whitespace-nowrap" : "truncate"}>
              {isGraph ? "Graph" : node?.title ?? "Unknown"}
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
                  ${isActive
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
  );
}
