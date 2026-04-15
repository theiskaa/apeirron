"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { GraphNode } from "@/lib/types";

interface Props {
  nodes: GraphNode[];
  open: boolean;
  onClose: () => void;
  onSelect: (nodeId: string) => void;
}

export default function CommandPalette({ nodes, open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes
      .map((node) => {
        const title = node.title.toLowerCase();
        let score = 0;
        if (title.startsWith(q)) score = 3;
        else if (title.includes(q)) score = 2;
        else if (node.category.toLowerCase().includes(q)) score = 1;
        return { node, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.node.title.localeCompare(b.node.title))
      .map((r) => r.node);
  }, [nodes, query]);

  const grouped = useMemo(() => {
    if (query.trim()) return null;
    const map = new Map<string, { label: string; color: string; nodes: GraphNode[] }>();
    for (const n of nodes) {
      if (!map.has(n.category)) {
        map.set(n.category, {
          label: n.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          color: n.color,
          nodes: [],
        });
      }
      map.get(n.category)!.nodes.push(n);
    }
    for (const g of map.values()) {
      g.nodes.sort((a, b) => a.title.localeCompare(b.title));
    }
    return Array.from(map.values());
  }, [nodes, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  const keyboardNav = useRef(false);
  useEffect(() => {
    if (!keyboardNav.current || !listRef.current) return;
    keyboardNav.current = false;
    const items = listRef.current.querySelectorAll("[role=option]");
    const item = items[selectedIndex] as HTMLElement;
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (nodeId: string) => {
      onSelect(nodeId);
      onClose();
    },
    [onSelect, onClose]
  );

  // Flat index for keyboard navigation across grouped items
  const flatBrowseNodes = useMemo(() => {
    if (!grouped) return [];
    return grouped.flatMap((g) => g.nodes);
  }, [grouped]);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible && !open) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults = hasQuery && filtered.length > 0;
  const hasNoResults = hasQuery && filtered.length === 0;
  const showBrowse = !hasQuery && grouped;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] transition-opacity duration-150"
      style={{ opacity: open ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{ backgroundColor: "rgb(0 0 0 / 0.35)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label="Search nodes"
        className="relative w-full max-w-xl mx-4 transition-all duration-150"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.98)",
        }}
        onKeyDown={(e) => {
          const list = hasQuery ? filtered : flatBrowseNodes;
          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              keyboardNav.current = true;
              setSelectedIndex((i) => Math.min(i + 1, list.length - 1));
              break;
            case "ArrowUp":
              e.preventDefault();
              keyboardNav.current = true;
              setSelectedIndex((i) => Math.max(i - 1, 0));
              break;
            case "Enter":
              e.preventDefault();
              if (list[selectedIndex]) handleSelect(list[selectedIndex].id);
              break;
            case "Escape":
              e.preventDefault();
              onClose();
              break;
          }
        }}
      >
        <div
          className="flex items-center gap-3 px-5 h-12 rounded-full transition-shadow"
          style={{
            backgroundColor: "var(--surface-elevated)",
            boxShadow: "var(--chrome-shadow)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes..."
            className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:outline-none focus:ring-0"
          />
        </div>

        <div
          className="mt-2 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--surface-elevated)",
            boxShadow: "var(--chrome-shadow)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {hasNoResults ? (
            <div className="px-5 py-6 text-center text-sm text-text-muted">
              No matching nodes
            </div>
          ) : showBrowse ? (
            <div ref={listRef} role="listbox" className="max-h-80 overflow-y-auto py-1.5 px-1.5 no-scrollbar">
              {(() => {
                let flatIdx = 0;
                return grouped.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.color }} />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        {group.label}
                      </span>
                    </div>
                    {group.nodes.map((node) => {
                      const idx = flatIdx++;
                      const selected = idx === selectedIndex;
                      return (
                        <button
                          key={node.id}
                          role="option"
                          aria-selected={selected}
                          onClick={() => handleSelect(node.id)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors rounded-xl"
                          style={{
                            backgroundColor: selected
                              ? "var(--accent-soft)"
                              : "transparent",
                          }}
                        >
                          <span
                            className="text-[13px] truncate"
                            style={{
                              color: selected
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                            }}
                          >
                            {node.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div ref={listRef} role="listbox" className="max-h-72 overflow-y-auto py-1.5 px-1.5 no-scrollbar">
              {filtered.map((node, i) => {
                const selected = i === selectedIndex;
                return (
                  <button
                    key={node.id}
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(node.id)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors rounded-xl"
                    style={{
                      backgroundColor: selected
                        ? "var(--accent-soft)"
                        : "transparent",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: node.color }}
                    />
                    <span
                      className="text-[13px] truncate"
                      style={{
                        color: selected
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {node.title}
                    </span>
                    <span className="ml-auto text-[11px] text-text-muted shrink-0">
                      {node.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
