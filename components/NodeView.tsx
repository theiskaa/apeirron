"use client";

import { memo, useCallback, useLayoutEffect, useRef, useEffect, useMemo, useState, type CSSProperties, type RefObject } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { GraphNode, GraphLink, ReadNextData } from "@/lib/types";
import { buildRoadmapOrder } from "@/lib/roadmap";
import { track } from "@/lib/analytics";
import { nodeAudioUrl, nodeTimingsUrl, type NodeTimings } from "@/lib/audio";
import { useAudioFollow } from "@/lib/useAudioFollow";
import { getPosition, savePosition } from "@/lib/positions";
import AudioPlayer from "./AudioPlayer";

// useLayoutEffect on the client (restore scroll before paint, no flash), plain
// useEffect on the server (React warns that layout effects do nothing in SSR).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const MiniGraph = dynamic(() => import("./MiniGraph"), { ssr: false });

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  node: GraphNode;
  contentHtml: string;
  loading?: boolean;
  links: GraphLink[];
  allNodes: GraphNode[];
  onNodeClick: (nodeId: string) => void;
  /**
   * Server-precomputed "Read next". When provided (incl. `null` = no next
   * node), it's used directly; when `undefined`, ReadNext computes it from
   * `allNodes` — correct only once the full graph is loaded.
   */
  readNext?: ReadNextData | null;
  /**
   * Reports whether the tab bar should currently be shown, based on reading
   * direction: hidden once you're reading downward, back the moment you scroll
   * up or return to the top. The scroll container lives here, but the header
   * lives in PageClient, so the signal has to be lifted.
   */
  onTabDockChange?: (visible: boolean) => void;
}

const GITHUB_REPO = "https://github.com/theiskaa/apeirron";

export default function NodeView({
  node,
  contentHtml,
  loading,
  links,
  allNodes,
  onNodeClick,
  readNext,
  onTabDockChange,
}: Props) {
  if (node.phantom) {
    return (
      <PhantomNodeView
        node={node}
        links={links}
        allNodes={allNodes}
        onNodeClick={onNodeClick}
      />
    );
  }
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // "Text follows audio" reading mode. `follow` is the user's persisted
  // preference; the mode only actually engages once this node's word timings
  // have loaded AND playback has started. `audioEl` is the shared <audio> handed
  // up by the player. Gating on `started` means pure readers never pay the cost
  // of wrapping every word in a span — that only happens on first play.
  const [follow, setFollow] = useState(true);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [timings, setTimings] = useState<NodeTimings | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setFollow(localStorage.getItem("apeirron:follow") !== "off");
  }, []);

  const toggleFollow = useCallback(() => {
    setFollow((f) => {
      const next = !f;
      try {
        localStorage.setItem("apeirron:follow", next ? "on" : "off");
      } catch {}
      return next;
    });
  }, []);

  const handleAudioElement = useCallback(
    (el: HTMLAudioElement | null) => setAudioEl(el),
    []
  );

  const handleContentClick = useCallback(
    (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-node-link]");
      if (target) {
        // Let the browser handle modifier-clicks (Cmd/Ctrl/Shift/middle) so
        // users can open links in new tabs or windows.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        const nodeId = target.getAttribute("data-node-link");
        if (nodeId) onNodeClick(nodeId);
        return;
      }
      const heading = (e.target as HTMLElement).closest("h2[id], h3[id]");
      if (heading) {
        const id = heading.getAttribute("id");
        if (id) {
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveId(id);
          window.history.replaceState(null, "", `#${id}`);
        }
      }
    },
    [onNodeClick]
  );

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener("click", handleContentClick);
    return () => el.removeEventListener("click", handleContentClick);
  }, [handleContentClick]);

  useEffect(() => {
    setActiveId(null);
    setStarted(false); // each node begins un-played (defers word wrapping)
  }, [node.id]);

  const { mainHtml, sourcesHtml } = useMemo(() => {
    const html = contentHtml;
    const sourcesMatch = html.match(
      /(<h2[^>]*id="sources"[^>]*>[\s\S]*$)/i
    );
    if (sourcesMatch) {
      return {
        mainHtml: html.slice(0, sourcesMatch.index),
        sourcesHtml: sourcesMatch[1],
      };
    }
    return { mainHtml: html, sourcesHtml: "" };
  }, [contentHtml]);

  // Restore the saved reading position per node. Runs before paint (no flash).
  // While content is still loading we park at the top and wait; once the prose
  // is in the DOM we jump to the saved offset exactly once per node.
  const scrollRestoredRef = useRef<string | null>(null);
  useIsoLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || scrollRestoredRef.current === node.id) return;
    if (!mainHtml) {
      scroll.scrollTop = 0; // loading — top; the real restore fires when ready
      return;
    }
    scroll.scrollTop = getPosition(node.id)?.scroll ?? 0;
    scrollRestoredRef.current = node.id;
  }, [node.id, mainHtml]);

  // Persist the reading position as the reader scrolls (rAF-throttled). Gated on
  // the restore having happened so we never overwrite the saved offset with the
  // transient 0 shown before restore.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (scrollRestoredRef.current === node.id) {
          savePosition(node.id, { scroll: scroll.scrollTop });
        }
      });
    };
    scroll.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroll.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [node.id]);

  // Anonymous, first-party read analytics (no cookies/PII — see lib/analytics).
  // `track` dedupes per session, so view/read/listen each count once per node.
  useEffect(() => {
    track(node.id, "view");
  }, [node.id]);

  // Count a "read" once the reader dwells ~30s on a node with real content.
  // The scroll-to-end check below also fires "read"; `track` dedupes either way.
  useEffect(() => {
    if (!mainHtml) return;
    const t = setTimeout(() => track(node.id, "read"), 30000);
    return () => clearTimeout(t);
  }, [node.id, mainHtml]);

  const tocItems = useMemo(() => {
    const items: TocItem[] = [
      { id: "_top", text: node.title, level: 1 },
    ];
    const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
    let match;
    while ((match = regex.exec(mainHtml)) !== null) {
      items.push({
        level: parseInt(match[1]),
        id: match[2],
        text: match[3].replace(/<[^>]*>/g, ""),
      });
    }
    return items;
  }, [mainHtml, node.title]);

  useEffect(() => {
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content || tocItems.length === 0) return;

    let ticking = false;
    let urlTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;

        const realItems = tocItems.filter((item) => item.id !== "_top");
        const headings = realItems
          .map((item) => content.querySelector(`#${CSS.escape(item.id)}`))
          .filter(Boolean) as HTMLElement[];

        const scrollTop = scroll.scrollTop;
        const offset = 136;

        // Reached the end of the article → count it as a read (deduped).
        if (scrollTop + scroll.clientHeight >= scroll.scrollHeight - 80) {
          track(node.id, "read");
        }

        if (headings.length === 0 || headings[0].offsetTop - scroll.offsetTop > scrollTop + offset) {
          setActiveId("_top");
          if (urlTimer) clearTimeout(urlTimer);
          urlTimer = setTimeout(() => {
            window.history.replaceState(null, "", window.location.pathname);
          }, 150);
          return;
        }

        let current = headings[0]?.id ?? "_top";
        for (const h of headings) {
          if (h.offsetTop - scroll.offsetTop <= scrollTop + offset) {
            current = h.id;
          } else {
            break;
          }
        }
        setActiveId(current);
        if (urlTimer) clearTimeout(urlTimer);
        urlTimer = setTimeout(() => {
          window.history.replaceState(null, "", current === "_top" ? window.location.pathname : `#${current}`);
        }, 150);
      });
    };

    scroll.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      scroll.removeEventListener("scroll", onScroll);
      if (urlTimer) clearTimeout(urlTimer);
    };
  }, [tocItems, node.id]);

  // Reading-direction chrome. Scrolling down into the article retracts the tab
  // bar so the text isn't read through it; scrolling up (or returning near the
  // top) brings it straight back. Deliberately does NOT change
  // --article-header: the article's top padding stays put, so retracting the
  // tabs never shifts the words you're reading.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || !onTabDockChange) return;

    const ALWAYS_SHOW_ABOVE = 24; // near the top the bar is always present
    const HIDE_BELOW = 96; // don't retract until clear of the header
    const JITTER = 6; // ignore momentum wobble / trackpad noise

    let last = scroll.scrollTop;
    let visible = true;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = scroll.scrollTop;
        const dy = y - last;
        // Below the jitter floor, keep `last` so small moves accumulate rather
        // than being discarded one frame at a time.
        if (Math.abs(dy) < JITTER) return;
        last = y;

        const next = y <= ALWAYS_SHOW_ABOVE ? true : dy < 0 ? true : y > HIDE_BELOW ? false : visible;
        if (next !== visible) {
          visible = next;
          onTabDockChange(next);
        }
      });
    };

    scroll.addEventListener("scroll", onScroll, { passive: true });
    onTabDockChange(true);
    return () => {
      scroll.removeEventListener("scroll", onScroll);
      onTabDockChange(true); // never leave the bar retracted on unmount
    };
  }, [onTabDockChange, node.id]);

  const handleTocClick = useCallback(
    (id: string) => {
      if (id === "_top") {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        setActiveId(id);
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }
      const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveId(id);
        window.history.replaceState(null, "", `#${id}`);
      }
    },
    []
  );

  // Pre-generated Kokoro narration for this node (served from R2). The player
  // only appears once a file has been published for the node.
  const audioUrl = nodeAudioUrl(node.id);

  // Load this node's per-word timings (small JSON) when it has audio. Absent
  // until the node has been processed by the speech pipeline — 404s silently and
  // the follow-along toggle simply doesn't appear.
  useEffect(() => {
    setTimings(null);
    if (!audioUrl) return;
    let alive = true;
    fetch(nodeTimingsUrl(node.id))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: NodeTimings) => alive && setTimings(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [node.id, audioUrl]);

  const { following, refocus } = useAudioFollow({
    enabled: follow && !!timings && started,
    audioEl,
    timings,
    contentRef,
    scrollRef,
    nodeId: node.id,
    contentReady: !!mainHtml,
  });
  const showRefocus = follow && !!timings && started && !following;

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto panel-scroll">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-[var(--article-header)] pb-8 flex gap-0">
        {tocItems.length > 0 && (
          <nav className="hidden xl:block w-52 2xl:w-60 shrink-0 pt-20 pr-6">
            <div className="sticky top-[calc(var(--article-header)_+_16px)]">
              <ul className="space-y-0.5">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleTocClick(item.id)}
                      style={{
                        color: activeId === item.id ? "var(--text-primary)" : "rgba(144,144,160,0.45)",
                        borderLeft: `2px solid ${
                          activeId === item.id ? node.color : "transparent"
                        }`,
                      }}
                      className={`text-left w-full text-[11px] leading-snug py-[3px] transition-colors ${
                        item.level === 3 ? "pl-5" : "pl-2.5"
                      }`}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = activeId === item.id ? "var(--text-primary)" : "rgba(144,144,160,0.45)"}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}

        <div className="flex-1 min-w-0">
          <span
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] mb-3"
            style={{ color: node.color }}
          >
            {formatCategoryLabel(node.category)}
          </span>
          <h1
            className="text-[2rem] sm:text-[2.6rem] leading-[1.05] tracking-tight text-text-primary mb-1"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 800 }}
          >
            {node.title}
          </h1>
          <NodeMeta publishedAt={node.publishedAt} updatedAt={node.updatedAt} />
          {audioUrl && (
            <div className="mt-4">
              <AudioPlayer
                key={node.id}
                src={audioUrl}
                peaksUrl={`/audio-peaks/${node.id}.json`}
                accent={node.color}
                onStart={() => {
                  setStarted(true); // engage follow-mode wrapping on first play
                  track(node.id, "listen");
                }}
                onAudioElement={handleAudioElement}
                onToggleFollow={timings ? toggleFollow : undefined}
                follow={follow}
                initialTime={getPosition(node.id)?.audio}
                onTime={(s) => savePosition(node.id, { audio: s })}
              />
            </div>
          )}
          <div className="mb-8" />

          <div className="hidden lg:block float-right ml-10 mb-6 w-96 xl:w-[420px]">
            <div className="space-y-8">
              <div>
                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Connections
                </h3>
                <MiniGraph
                  currentNodeId={node.id}
                  allNodes={allNodes}
                  allLinks={links}
                  onNodeClick={onNodeClick}
                />
                <ConnectionReasons
                  nodeId={node.id}
                  links={links}
                  allNodes={allNodes}
                  onNodeClick={onNodeClick}
                />
              </div>
              {sourcesHtml && (
                <>
                  <hr style={{ borderColor: "rgba(144,144,160,0.15)" }} />
                  <div>
                    <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Sources
                    </h3>
                    <div
                      className="prose-apeirron prose-apeirron-sources"
                      dangerouslySetInnerHTML={{ __html: sourcesHtml.replace(/<h2[^>]*>.*?<\/h2>/i, "") }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {mainHtml ? (
            <ArticleBody
              html={mainHtml}
              accent={node.color}
              innerRef={contentRef}
            />
          ) : loading ? (
            <ContentSkeleton />
          ) : (
            <div
              className="text-[13px] text-text-muted/70 py-6"
              role="status"
            >
              Couldn&apos;t load content. Try refreshing the page.
            </div>
          )}

          {/* Only once the article is in — during loading it would float up
              beside the skeleton as the first "real" content on the page. */}
          {mainHtml && (
            <ReadNext
              nodeId={node.id}
              allNodes={allNodes}
              precomputed={readNext}
              onNodeClick={onNodeClick}
            />
          )}

          <div className="clear-both" />

          <div className="lg:hidden mt-10 space-y-8">
            <div>
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                Connections
              </h3>
              <MiniGraph
                currentNodeId={node.id}
                allNodes={allNodes}
                allLinks={links}
                onNodeClick={onNodeClick}
              />
              <ConnectionReasons
                nodeId={node.id}
                links={links}
                allNodes={allNodes}
                onNodeClick={onNodeClick}
              />
            </div>
            {sourcesHtml && (
              <div>
                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Sources
                </h3>
                <div
                  className="prose-apeirron prose-apeirron-sources"
                  dangerouslySetInnerHTML={{ __html: sourcesHtml.replace(/<h2[^>]*>.*?<\/h2>/i, "") }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reader scrolled away while following — offer a snap-back to the flow. */}
      {showRefocus && (
        <button
          type="button"
          onClick={refocus}
          aria-label="Refocus on the narrated word"
          className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-full pl-2.5 pr-3.5 py-1.5 text-[11px] font-medium active:scale-95 transition-transform"
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)",
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--chrome-shadow)",
          }}
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
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2.5v3.5M12 18v3.5M2.5 12h3.5M18 12h3.5" />
          </svg>
          Resume follow
        </button>
      )}
    </div>
  );
}

/**
 * The rendered article prose. Memoized on (html, accent) so it does NOT
 * re-render when unrelated NodeView state changes (audio follow state, active
 * TOC id, …). This is essential: React re-applies `dangerouslySetInnerHTML` on
 * every render of the owning element, which would wipe the per-word <span>s that
 * the "text follows audio" mode injects into this DOM. Keeping this subtree
 * stable except when the article itself changes lets those spans survive.
 */
const ArticleBody = memo(function ArticleBody({
  html,
  accent,
  innerRef,
}: {
  html: string;
  accent: string;
  innerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={innerRef}
      className="prose-apeirron"
      style={{ "--lyric-accent": accent } as CSSProperties}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

function PhantomNodeView({
  node,
  links,
  allNodes,
  onNodeClick,
}: Omit<Props, "contentHtml" | "loading">) {
  const nodeMap = useMemo(
    () => new Map(allNodes.map((n) => [n.id, n])),
    [allNodes]
  );

  // Find all real nodes that reference this phantom node
  const referencedBy = useMemo(() => {
    const getId = (v: any): string => (typeof v === "object" && v !== null ? v.id : v);
    return links
      .filter((l) => getId(l.source) === node.id || getId(l.target) === node.id)
      .map((l) => {
        const srcId = getId(l.source);
        const tgtId = getId(l.target);
        const otherId = srcId === node.id ? tgtId : srcId;
        const other = nodeMap.get(otherId);
        if (!other) return null;
        return { id: otherId, title: other.title, color: other.color, reason: l.reason };
      })
      .filter(Boolean) as { id: string; title: string; color: string; reason: string }[];
  }, [links, node.id, nodeMap]);

  const referencedByList = (
    <>
      {referencedBy.length > 0 && (
        <div className="mt-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: "rgba(144,144,160,0.6)" }}
          >
            Referenced by
          </h3>
          <div className="space-y-2">
            {referencedBy.map((r) => (
              <Link
                key={r.id}
                href={`/node/${r.id}`}
                prefetch={false}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  onNodeClick(r.id);
                }}
                className="group block rounded-lg px-3 py-2.5 -mx-3 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex-1 text-[13px] leading-snug text-text-primary group-hover:underline decoration-1 underline-offset-2"
                    style={{ fontFamily: "var(--font-serif)", fontWeight: 700 }}
                  >
                    {r.title}
                  </span>
                  <span
                    className="text-text-muted opacity-0 -translate-x-1 transition-[opacity,transform] ease-[var(--ease-out)] group-hover:opacity-60 group-hover:translate-x-0 text-[11px]"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </span>
                <span
                  className="block text-[11px] leading-relaxed mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {r.reason}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="max-w-[720px] mx-auto px-6 lg:px-12 pt-[var(--article-header)] pb-12">
        <div className="flex items-center gap-3 mb-8">
          <h1
            className="text-[2rem] sm:text-[2.4rem] leading-[1.05] tracking-tight text-text-primary"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 800 }}
          >
            {node.title}
          </h1>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"
            style={{
              color: "rgba(144,144,160,0.8)",
              borderColor: "rgba(144,144,160,0.25)",
              backgroundColor: "rgba(144,144,160,0.06)",
            }}
          >
            Proposed
          </span>
        </div>

        <div
          className="rounded-lg px-6 py-8 border"
          style={{
            borderColor: "rgba(144,144,160,0.15)",
            backgroundColor: "rgba(144,144,160,0.03)",
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <svg
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: "rgba(144,144,160,0.6)" }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <div>
              <p className="text-sm text-text-secondary leading-relaxed">
                This node hasn&apos;t been written yet. It exists as a proposed topic based on
                connections from other nodes in the graph.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(144,144,160,0.12)" }}>
            <p className="text-xs text-text-muted mb-4">
              Want to write this node? Contributions are welcome.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={`/contribute?node=${node.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "rgba(144,144,160,0.1)",
                  color: "var(--text-primary)",
                  border: "1px solid rgba(144,144,160,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(144,144,160,0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(144,144,160,0.1)";
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Write this node
              </a>
              <a
                href={`${GITHUB_REPO}/issues/new?template=new-node.yml&title=${encodeURIComponent("New node: " + node.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                or contribute on GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
            Connections
          </h3>
          <MiniGraph
            currentNodeId={node.id}
            allNodes={allNodes}
            allLinks={links}
            onNodeClick={onNodeClick}
            interactive={false}
          />
          {referencedByList}
        </div>
      </div>
    </div>
  );
}

function ConnectionReasons({
  nodeId,
  links,
  allNodes,
  onNodeClick,
}: {
  nodeId: string;
  links: GraphLink[];
  allNodes: GraphNode[];
  onNodeClick: (id: string) => void;
}) {
  const nodeMap = useMemo(
    () => new Map(allNodes.map((n) => [n.id, n])),
    [allNodes]
  );

  const reasons = useMemo(() => {
    const getId = (v: any): string => (typeof v === "object" && v !== null ? v.id : v);
    return links
      .filter((l) => getId(l.source) === nodeId || getId(l.target) === nodeId)
      .map((l) => {
        const srcId = getId(l.source);
        const tgtId = getId(l.target);
        const otherId = srcId === nodeId ? tgtId : srcId;
        const other = nodeMap.get(otherId);
        if (!other) return null;
        return { id: otherId, title: other.title, color: other.color, reason: l.reason };
      })
      .filter(Boolean) as { id: string; title: string; color: string; reason: string }[];
  }, [links, nodeId, nodeMap]);

  if (reasons.length === 0) return null;

  return (
    <div className="mt-6">
      <div
        className="space-y-1 pl-4 border-l"
        style={{
          borderColor:
            "color-mix(in srgb, var(--text-primary) 12%, transparent)",
        }}
      >
        {reasons.map((r) => (
          <Link
            key={r.id}
            href={`/node/${r.id}`}
            prefetch={false}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              onNodeClick(r.id);
            }}
            className="group block py-2 -ml-px"
          >
            <span className="flex items-center gap-2">
              <span
                className="flex-1 text-[13px] leading-snug text-text-primary group-hover:underline decoration-1 underline-offset-2"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 700 }}
              >
                {r.title}
              </span>
              <span
                className="text-text-muted opacity-0 -translate-x-1 transition-[opacity,transform] ease-[var(--ease-out)] group-hover:opacity-60 group-hover:translate-x-0 text-[11px]"
                aria-hidden="true"
              >
                →
              </span>
            </span>
            <span
              className="block text-[11px] leading-relaxed mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {r.reason}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ReadNext({
  nodeId,
  allNodes,
  precomputed,
  onNodeClick,
}: {
  nodeId: string;
  allNodes: GraphNode[];
  precomputed?: ReadNextData | null;
  onNodeClick: (id: string) => void;
}) {
  const nodeMap = useMemo(
    () => new Map(allNodes.map((n) => [n.id, n])),
    [allNodes]
  );

  // "Read next" follows the single roadmap order (content/roadmap.json), the
  // same sequence the /nodes "Roadmap" sort renders. The curated path comes
  // first; once past it, the tail is ordered by connectivity. Phantom nodes are
  // excluded so the order matches the index page (which never lists phantoms).
  // This is only correct when `allNodes` is the full graph; on a direct node
  // visit (neighbor subset only) the server passes `precomputed` instead.
  const computed = useMemo(() => {
    const { order, curatedCount } = buildRoadmapOrder(
      allNodes
        .filter((n) => !n.phantom)
        .map((n) => ({ id: n.id, weight: n.val }))
    );
    const idx = order.indexOf(nodeId);
    if (idx === -1 || idx >= order.length - 1) return null;
    const nextNode = nodeMap.get(order[idx + 1]);
    if (!nextNode) return null;
    const onPath = idx + 1 < curatedCount;
    return {
      node: nextNode,
      kicker: onPath ? "The Path" : "Beyond the path",
      label: onPath ? `${idx + 2} of ${curatedCount}` : "",
    };
  }, [nodeId, nodeMap, allNodes]);

  const next = precomputed !== undefined ? precomputed : computed;

  if (!next) return null;

  return (
    <div className="mt-14 mb-8">
      <div
        className="w-full h-px mb-8"
        style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 6%, transparent)" }}
      />
      <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">
        Read next
      </h3>
      <Link
        href={`/node/${next.node.id}`}
        prefetch={false}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          onNodeClick(next.node.id);
        }}
        className="group block text-left rounded-xl p-4 transition-transform duration-150 ease-[var(--ease-out)] hover:scale-[1.01]"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--text-primary) 3%, transparent)",
          boxShadow:
            "inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 7%, transparent)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "color-mix(in srgb, var(--text-primary) 6%, transparent)";
          e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${next.node.color}33`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            "color-mix(in srgb, var(--text-primary) 3%, transparent)";
          e.currentTarget.style.boxShadow =
            "inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 7%, transparent)";
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-text-muted/50 tracking-wide">
            {next.kicker}
          </span>
          {next.label && (
            <span className="text-[9px] text-text-muted/30 tabular-nums ml-auto">
              {next.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-medium text-text-primary group-hover:text-text-primary/90 transition-colors">
            {next.node.title}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-auto shrink-0 text-text-muted/30 group-hover:text-text-muted/70 group-hover:translate-x-0.5 transition-[color,transform] ease-[var(--ease-out)]"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>
    </div>
  );
}

function formatCategoryLabel(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ContentSkeleton() {
  // Paragraph-shaped placeholder lines. The root is a BFC (overflow-hidden) so
  // the whole block narrows to sit beside the floated Connections panel the way
  // real prose lines do — plain block divs would paint their backgrounds
  // underneath the float. Pulse is killed by the global reduced-motion rule.
  const paragraphs = [
    ["100%", "97%", "94%", "62%"],
    ["98%", "95%", "99%", "40%"],
    ["96%", "100%", "93%", "71%"],
    ["99%", "94%", "97%", "55%"],
  ];
  return (
    <div
      className="overflow-hidden animate-pulse select-none"
      role="status"
      aria-label="Loading content"
    >
      {paragraphs.map((lines, pi) => (
        <div key={pi} className="mb-7">
          {lines.map((width, li) => (
            <div
              key={li}
              style={{
                width,
                height: 13,
                marginBottom: 12,
                backgroundColor:
                  "color-mix(in srgb, var(--text-primary) 6%, transparent)",
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function NodeMeta({
  publishedAt,
  updatedAt,
}: {
  publishedAt?: string;
  updatedAt?: string;
}) {
  if (!publishedAt && !updatedAt) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const sameDay =
    publishedAt && updatedAt && publishedAt.slice(0, 10) === updatedAt.slice(0, 10);
  const showUpdated = updatedAt && !sameDay;
  return (
    <div className="mt-1.5 text-[11px] text-text-muted/70 flex items-center gap-2 flex-wrap">
      {publishedAt && (
        <time dateTime={publishedAt}>Published {fmt(publishedAt)}</time>
      )}
      {showUpdated && (
        <>
          <span aria-hidden="true" className="text-text-muted/40">·</span>
          <time dateTime={updatedAt}>Updated {fmt(updatedAt)}</time>
        </>
      )}
    </div>
  );
}
