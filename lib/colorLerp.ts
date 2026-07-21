/**
 * Minimal color interpolation, used to crossfade the graph canvas between
 * themes in lockstep with the CSS transition on <body>.
 *
 * The graph's theme variables come in three shapes and have to be handed back
 * in the same shape they arrived in, because the painting code interpolates
 * some of them into strings itself:
 *
 *   #f8f8fa                 → hex
 *   rgba(90, 90, 105, 0.18) → rgba (or rgb)
 *   160, 160, 180           → bare channels, for `rgba(${v}, 0.4)` templates
 */

export type Rgba = [r: number, g: number, b: number, a: number];

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Parses hex, rgb()/rgba(), or a bare "r, g, b" triple. Null if unrecognized. */
export function parseColor(input: string): Rgba | null {
  const s = input.trim();

  const hex = s.match(HEX);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      1,
    ];
  }

  const nums = s
    .replace(/^rgba?\(/i, "")
    .replace(/\)$/, "")
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);
  if (nums.length >= 3 && nums.slice(0, 3).every((n) => Number.isFinite(n))) {
    const a = nums.length > 3 && Number.isFinite(nums[3]) ? nums[3] : 1;
    return [nums[0], nums[1], nums[2], a];
  }

  return null;
}

/** Re-serializes in the same shape as `like`, so callers can swap values in place. */
export function formatColor(c: Rgba, like: string): string {
  const [r, g, b, a] = [
    Math.round(c[0]),
    Math.round(c[1]),
    Math.round(c[2]),
    c[3],
  ];
  const s = like.trim();
  if (HEX.test(s)) {
    const h = (n: number) => n.toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  // A bare triple stays a bare triple; anything else becomes rgba().
  if (!/^rgba?\(/i.test(s)) return `${r}, ${g}, ${b}`;
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

/** Linear interpolation between two parsed colors; t is clamped to 0..1. */
export function lerpColor(from: Rgba, to: Rgba, t: number): Rgba {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return [
    from[0] + (to[0] - from[0]) * k,
    from[1] + (to[1] - from[1]) * k,
    from[2] + (to[2] - from[2]) * k,
    from[3] + (to[3] - from[3]) * k,
  ];
}

/**
 * Crossfades a record of color strings from → to over `duration` ms, calling
 * `onFrame` with fully-formatted values each animation frame. Linear, to match
 * the `linear` color transitions used in globals.css. Returns a cancel fn.
 *
 * Any value that can't be parsed is swapped at the first frame rather than
 * interpolated, so an unexpected color format degrades to today's behavior.
 */
export function crossfadeColors<K extends string>(
  from: Record<K, string>,
  to: Record<K, string>,
  duration: number,
  onFrame: (values: Record<K, string>) => void
): () => void {
  const keys = Object.keys(to) as K[];
  const pairs = keys.map((k) => ({
    key: k,
    from: parseColor(from[k] ?? ""),
    to: parseColor(to[k] ?? ""),
  }));

  let raf = 0;
  let start = 0;

  const step = (now: number) => {
    if (!start) start = now;
    const t = duration > 0 ? Math.min((now - start) / duration, 1) : 1;

    const out = {} as Record<K, string>;
    for (const p of pairs) {
      out[p.key] =
        p.from && p.to
          ? formatColor(lerpColor(p.from, p.to, t), to[p.key])
          : to[p.key];
    }
    onFrame(out);

    if (t < 1) raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
