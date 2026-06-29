"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CommandPalette, {
  type CommandAction,
  type PaletteNode,
} from "./CommandPalette";

type NodeSelectHandler = (nodeId: string) => void;
type ActionsGetter = () => CommandAction[];

interface SearchControls {
  /** Open the global search palette. */
  openSearch: () => void;
  /**
   * Override what happens when a node is chosen from search. Pass `null` to
   * restore the default (navigate to the node's article). The graph view
   * registers a focus-in-canvas handler here while it is mounted.
   */
  setNodeSelectHandler: (fn: NodeSelectHandler | null) => void;
  /**
   * Override the non-node command actions surfaced by the palette. Pass `null`
   * to restore the universal defaults.
   */
  setActionsGetter: (getter: ActionsGetter | null) => void;
}

const noop = () => {};

// Default value keeps `useSearch()` resilient if a consumer (e.g. Navbar) is
// ever rendered outside the provider — it simply no-ops rather than throwing.
const SearchContext = createContext<SearchControls>({
  openSearch: noop,
  setNodeSelectHandler: noop,
  setActionsGetter: noop,
});

export function useSearch(): SearchControls {
  return useContext(SearchContext);
}

// Defaults used on every route that is not the interactive graph: selecting a
// node navigates to its article, and only universal commands are offered.
// Hard navigation (window.location) matches the rest of the app, which does not
// use the Next client router.
const defaultSelect: NodeSelectHandler = (nodeId) => {
  window.location.href = `/node/${nodeId}`;
};

const defaultActions: ActionsGetter = () => [
  {
    id: "cmd:go-graph",
    label: "Go to the graph",
    hint: "Navigation",
    keywords: ["home", "graph", "map", "main"],
    perform: () => {
      window.location.href = "/";
    },
  },
  {
    id: "cmd:open-index",
    label: "Browse all nodes",
    hint: "Navigation",
    keywords: ["index", "nodes", "all", "browse", "list"],
    perform: () => {
      window.location.href = "/nodes";
    },
  },
];

export default function SearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // The palette index is static data — fetched once on mount from /nodes.json
  // (a CDN-served asset) rather than serialized into every page's RSC payload.
  // Prefetching on mount keeps the first ⌘K instant.
  const [nodes, setNodes] = useState<PaletteNode[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/nodes.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: PaletteNode[]) => {
        if (!cancelled) setNodes(data);
      })
      .catch(() => {
        // Leave empty; the palette still offers command actions, and search
        // degrades to "No matching nodes" rather than breaking.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  // Bumped whenever a handler/actions getter is (un)registered, so the palette
  // re-reads the refs. Children are passed as a stable prop, so neither this
  // nor `open` re-renders the page subtree below the provider.
  const [version, setVersion] = useState(0);

  const selectHandlerRef = useRef<NodeSelectHandler>(defaultSelect);
  const actionsGetterRef = useRef<ActionsGetter>(defaultActions);

  // ⌘K / Ctrl+K opens the palette globally (open-only — Escape/backdrop close).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const setNodeSelectHandler = useCallback((fn: NodeSelectHandler | null) => {
    selectHandlerRef.current = fn ?? defaultSelect;
    setVersion((v) => v + 1);
  }, []);

  const setActionsGetter = useCallback((getter: ActionsGetter | null) => {
    actionsGetterRef.current = getter ?? defaultActions;
    setVersion((v) => v + 1);
  }, []);

  const controls = useMemo<SearchControls>(
    () => ({
      openSearch: () => setOpen(true),
      setNodeSelectHandler,
      setActionsGetter,
    }),
    [setNodeSelectHandler, setActionsGetter]
  );

  // Recomputed when the palette opens or a registration changes.
  const actions = useMemo<CommandAction[]>(
    () => actionsGetterRef.current(),
    [open, version]
  );

  return (
    <SearchContext.Provider value={controls}>
      {children}
      <CommandPalette
        nodes={nodes}
        actions={actions}
        open={open}
        onClose={() => setOpen(false)}
        onSelectNode={(id) => selectHandlerRef.current(id)}
      />
    </SearchContext.Provider>
  );
}
