"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { NodeTimings } from "./audio";
import { activeIndex, buildBoundaries } from "./align";

/**
 * "Text follows audio" — the Spotify-lyrics reading mode, in place in the
 * article. While narration plays, the word currently being spoken is highlighted
 * in the prose, the view gently keeps it in sight, and clicking a word seeks the
 * audio to it.
 *
 * How it works: on activation we wrap every prose word in a `<span.lyric-word>`
 * (once), align those words to the narration's spoken-word timestamps
 * (`buildBoundaries`), then run a requestAnimationFrame loop off the shared
 * `<audio>` element's `currentTime` — far smoother than the ~4Hz `timeupdate`
 * event — flipping the `is-active` class as the boundary is crossed. All of this
 * is imperative DOM work (no React re-render per frame) so it stays cheap even on
 * a long article of several thousand words.
 */

// The active word is kept inside this vertical band of the reading pane; when it
// drifts out we scroll it back to REVEAL. Fractions of the pane height.
const BAND_TOP = 0.2;
const BAND_BOTTOM = 0.72;
const REVEAL = 0.4;

/**
 * Wrap each prose word in a span, returning them in document order. Idempotent
 * and self-correcting: it keys off whether the spans are actually present in the
 * DOM, so if React re-rendered the prose (wiping our spans) we simply re-wrap —
 * we never trust a stale "already wrapped" flag that could outlive the spans.
 */
function wrapWords(container: HTMLElement): HTMLElement[] {
  const existing = container.querySelectorAll<HTMLElement>(".lyric-word");
  if (existing.length > 0) return Array.from(existing);

  // Collect text nodes first — mutating the tree mid-walk invalidates the walker.
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const t = node as Text;
    if (!t.nodeValue || !t.nodeValue.trim()) continue;
    // Footnote reference markers ([1]) are superscripts and aren't narrated.
    if ((t.parentElement as HTMLElement | null)?.closest("sup")) continue;
    texts.push(t);
  }

  const spans: HTMLElement[] = [];
  for (const text of texts) {
    const parts = text.nodeValue!.split(/(\s+)/); // keep the whitespace runs
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement("span");
        span.className = "lyric-word";
        span.textContent = part;
        frag.appendChild(span);
        spans.push(span);
      }
    }
    text.parentNode?.replaceChild(frag, text);
  }

  return spans;
}

interface Options {
  enabled: boolean;
  audioEl: HTMLAudioElement | null;
  timings: NodeTimings | null;
  contentRef: RefObject<HTMLElement | null>;
  scrollRef: RefObject<HTMLElement | null>;
  /** Re-run wrapping/alignment whenever the article changes. */
  nodeId: string;
  /**
   * Whether the prose has actually mounted into `contentRef`. The article HTML
   * and the timings load independently; without this as a dependency the effect
   * could run before the prose exists, wrap nothing, and never re-run — the word
   * highlight would silently fail to appear.
   */
  contentReady: boolean;
}

export function useAudioFollow({
  enabled,
  audioEl,
  timings,
  contentRef,
  scrollRef,
  nodeId,
  contentReady,
}: Options): { following: boolean; refocus: () => void } {
  // Two states while the mode is engaged:
  //  - following: the view auto-scrolls to keep the spoken word in sight.
  //  - detached: the reader scrolled away by hand; we stop following and surface
  //    a "refocus" button. A ref mirrors the state so the rAF loop can read it
  //    without the effect depending on it (which would tear down the loop).
  const [following, setFollowing] = useState(true);
  const followingRef = useRef(true);
  const refocusRef = useRef<() => void>(() => {});

  const setFollow = useCallback((v: boolean) => {
    followingRef.current = v;
    setFollowing(v);
  }, []);

  // Snap back to the current word and resume following (the refocus button).
  const refocus = useCallback(() => {
    setFollow(true);
    refocusRef.current();
  }, [setFollow]);

  useEffect(() => {
    const content = contentRef.current;
    const scroller = scrollRef.current;
    if (!enabled || !audioEl || !timings || !content) return;

    const spans = wrapWords(content);
    if (spans.length === 0) return;
    content.classList.add("lyrics-on");
    // Start from a clean slate so a re-enable always repaints correctly.
    content
      .querySelectorAll(".lyric-word.is-active")
      .forEach((el) => el.classList.remove("is-active"));

    const boundaries = buildBoundaries(
      spans.map((s) => s.textContent || ""),
      timings.words,
      timings.duration
    );

    let current = -1;
    let raf = 0;
    // (Re)engaging the mode always starts in the following state.
    setFollow(true);

    // Scroll the word toward REVEAL. `force` ignores the comfortable band (used
    // for an explicit jump — refocus or a seek); otherwise we only move once the
    // word drifts out of the band, so following doesn't twitch every word.
    const reveal = (span: HTMLElement, force: boolean) => {
      if (!scroller) return;
      const box = scroller.getBoundingClientRect();
      const r = span.getBoundingClientRect();
      if (!force) {
        const bandTop = box.top + box.height * BAND_TOP;
        const bandBottom = box.top + box.height * BAND_BOTTOM;
        if (r.top >= bandTop && r.bottom <= bandBottom) return;
      }
      const target = scroller.scrollTop + (r.top - box.top) - box.height * REVEAL;
      scroller.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    };

    refocusRef.current = () => {
      const idx = current >= 0 ? current : activeIndex(boundaries, audioEl.currentTime);
      const span = spans[idx];
      if (span) reveal(span, true);
    };

    const paint = ({ force = false, noScroll = false } = {}) => {
      const idx = activeIndex(boundaries, audioEl.currentTime);
      const changed = idx !== current;
      if (changed) {
        spans[current]?.classList.remove("is-active");
        spans[idx]?.classList.add("is-active");
        current = idx;
      }
      const span = spans[idx];
      if (!noScroll && span && (force || (followingRef.current && changed))) {
        reveal(span, force);
      }
    };

    const loop = () => {
      paint();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // A real user scroll gesture detaches following (our own scrollTo never fires
    // wheel/touchmove, so auto-scroll won't detach itself). The reader gets it
    // back via the refocus button.
    const onUserScroll = () => setFollow(false);
    // A manual seek/skip is an explicit jump: re-engage following and snap the
    // highlight (and view) to the new position.
    const onSeeked = () => {
      setFollow(true);
      paint({ force: true });
    };
    // Click a word → seek there. Skip links/headings, which have their own
    // click behavior (navigate / scroll-to-heading) in NodeView.
    const onClick = (e: MouseEvent) => {
      const word = (e.target as HTMLElement).closest<HTMLElement>(".lyric-word");
      if (!word || word.closest("a, h2, h3")) return;
      const idx = spans.indexOf(word);
      if (idx < 0) return;
      setFollow(true);
      audioEl.currentTime = boundaries[idx];
      paint({ force: true });
    };

    audioEl.addEventListener("play", start);
    audioEl.addEventListener("pause", stop);
    audioEl.addEventListener("ended", stop);
    audioEl.addEventListener("seeked", onSeeked);
    scroller?.addEventListener("wheel", onUserScroll, { passive: true });
    scroller?.addEventListener("touchmove", onUserScroll, { passive: true });
    content.addEventListener("click", onClick);

    paint({ noScroll: true }); // reflect current word without moving the view
    if (!audioEl.paused) start();

    return () => {
      stop();
      audioEl.removeEventListener("play", start);
      audioEl.removeEventListener("pause", stop);
      audioEl.removeEventListener("ended", stop);
      audioEl.removeEventListener("seeked", onSeeked);
      scroller?.removeEventListener("wheel", onUserScroll);
      scroller?.removeEventListener("touchmove", onUserScroll);
      content.removeEventListener("click", onClick);
      refocusRef.current = () => {};
      spans[current]?.classList.remove("is-active");
      content.classList.remove("lyrics-on");
    };
    // Re-wrap/re-align when the article changes, the prose mounts, or the
    // mode/data toggles. `following` is intentionally excluded (a ref carries it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, audioEl, timings, nodeId, contentReady]);

  return { following, refocus };
}
