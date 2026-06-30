// Persisted open-tab workspace. The tab IDs in PageClient are deterministic
// ("graph" / `node:<id>`) and content/graph are fetched on demand, so durable
// persistence needs only the ordered open node IDs + the active tab ID — the
// rest rebuilds itself on rehydration. Mirrors lib/themes.ts: a small module
// owning the storage key + guarded read/write/validate.

export const TABS_STORAGE_KEY = "apeirron:tabs:v1";

export interface StoredTabs {
  /** Ordered open node IDs. The graph tab is implicit (always present, first). */
  nodes: string[];
  /** The active tab ID: "graph" or `node:<id>`. */
  active: string;
}

export function readStoredTabs(): StoredTabs | null {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    const nodes = Array.isArray(obj.nodes)
      ? obj.nodes.filter((n): n is string => typeof n === "string")
      : [];
    const active = typeof obj.active === "string" ? obj.active : "graph";
    return { nodes, active };
  } catch {
    return null;
  }
}

export function writeStoredTabs(data: StoredTabs): void {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable (private mode / quota) — persistence is best-effort.
  }
}
