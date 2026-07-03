// Per-node "resume where you left off" state: the reading scroll offset and the
// audio playback time, persisted to localStorage so returning to a tab (or
// reopening the app) restores your place. Keyed by node id, independent of the
// open-tab set (lib/tabs.ts) — you resume a node even after closing its tab and
// reopening it later. Mirrors lib/tabs.ts: a small module owning the storage key
// plus guarded read/write, with an in-memory cache + debounced flush so frequent
// scroll/timeupdate saves don't thrash storage.

const STORAGE_KEY = "apeirron:positions:v1";
// Cap stored nodes so the blob can't grow without bound; the least-recently
// touched entries are dropped first.
const MAX_ENTRIES = 150;
const FLUSH_DELAY = 600;

export interface NodePosition {
  /** Reading scroll offset in px. */
  scroll?: number;
  /** Audio playback time in seconds. */
  audio?: number;
  /** Last-touched epoch ms, for LRU pruning. */
  at?: number;
}

let cache: Record<string, NodePosition> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function load(): Record<string, NodePosition> {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = {});
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    cache = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function flush(): void {
  flushTimer = null;
  if (typeof window === "undefined" || !cache) return;
  try {
    const entries = Object.entries(cache);
    if (entries.length > MAX_ENTRIES) {
      entries.sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0));
      cache = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage unavailable (private mode / quota) — best-effort.
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_DELAY);
}

/** The saved position for a node, or undefined if none. Returns a copy so the
 *  internal cache can't be mutated by callers. */
export function getPosition(nodeId: string): NodePosition | undefined {
  const p = load()[nodeId];
  return p ? { ...p } : undefined;
}

/** Merge a partial position for a node (in-memory now, persisted debounced). */
export function savePosition(nodeId: string, patch: Partial<NodePosition>): void {
  if (!nodeId) return;
  const c = load();
  c[nodeId] = { ...c[nodeId], ...patch, at: Date.now() };
  scheduleFlush();
}

/** Force any pending write immediately (call on pagehide / tab hidden). */
export function flushPositions(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flush();
}
