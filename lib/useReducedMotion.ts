"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the `prefers-reduced-motion: reduce` user setting, live.
 *
 * CSS in globals.css already narrows transitions and cuts keyframe animation
 * for this preference, but it cannot reach motion drawn into a <canvas> — the
 * force-directed graph runs its own requestAnimationFrame loop and keeps
 * drifting forever regardless of any stylesheet. Components that animate
 * outside the DOM read this hook and stand their motion down themselves.
 *
 * Starts `false` so server and first client render agree, then corrects in an
 * effect; it also follows the setting if the user changes it while the page is
 * open.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
