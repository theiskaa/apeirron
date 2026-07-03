/**
 * Align the on-page prose words to the narration's spoken-word timeline.
 *
 * The narrated text and the displayed article diverge (clean.py drops the
 * Sources section, rewords `[[wikilinks]]`, expands some symbols; the model may
 * also split or merge tokens). So instead of demanding a 1:1 match we find
 * reliable ANCHORS — prose words whose normalized form equals a spoken word, in
 * order — then linearly INTERPOLATE times across the gaps between anchors. The
 * result is a monotonic boundary per word: prose word `k` is the active word
 * during `[boundaries[k], boundaries[k + 1])`. This stays smooth and gapless
 * even where the two texts don't line up exactly.
 */

/** Lowercase and strip everything but letters/digits (keeps years like "1996"). */
export function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

// How far ahead to look on either stream when resynchronizing after a mismatch.
// Comfortably covers a number/symbol expansion or a reworded wikilink.
const RESYNC_WINDOW = 14;

/**
 * Build per-word time boundaries. Returns an array of length `prose.length + 1`;
 * word `k` is active during `[out[k], out[k + 1])`. Monotonic non-decreasing.
 */
export function buildBoundaries(
  prose: string[],
  spoken: [string, number, number][],
  duration: number
): number[] {
  const n = prose.length;
  const m = spoken.length;
  if (n === 0) return [0];

  const end = duration > 0 ? duration : m ? spoken[m - 1][2] : 0;
  // No timing data at all — spread evenly so the highlight still "follows".
  if (m === 0) return Array.from({ length: n + 1 }, (_, k) => (end * k) / n);

  const P = prose.map(normalizeWord);
  const S = spoken.map((s) => normalizeWord(s[0]));

  // 1) Anchors: two-pointer greedy match with a bounded resync on mismatch.
  const anchorIdx: number[] = []; // prose index of each anchor
  const anchorT: number[] = []; // spoken start time of each anchor
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (P[i] && P[i] === S[j]) {
      anchorIdx.push(i);
      anchorT.push(spoken[j][1]);
      i++;
      j++;
      continue;
    }
    // Find the nearest re-match by advancing one stream or the other.
    let stepped = false;
    for (let d = 1; d <= RESYNC_WINDOW; d++) {
      if (i + d < n && P[i + d] && P[i + d] === S[j]) {
        i += d;
        stepped = true;
        break;
      }
      if (j + d < m && P[i] && P[i] === S[j + d]) {
        j += d;
        stepped = true;
        break;
      }
    }
    if (!stepped) {
      i++;
      j++;
    }
  }

  // 2) Sentinels at the ends so every word falls inside an interpolation span.
  if (anchorIdx.length === 0 || anchorIdx[0] !== 0) {
    anchorIdx.unshift(0);
    anchorT.unshift(0);
  }
  if (anchorIdx[anchorIdx.length - 1] !== n) {
    anchorIdx.push(n);
    anchorT.push(end);
  }
  // Defensive: keep times non-decreasing even if the model timeline hiccuped.
  for (let k = 1; k < anchorT.length; k++) {
    if (anchorT[k] < anchorT[k - 1]) anchorT[k] = anchorT[k - 1];
  }

  // 3) Piecewise-linear fill from anchor to anchor.
  const boundaries = new Array<number>(n + 1);
  let seg = 0;
  for (let k = 0; k <= n; k++) {
    while (seg < anchorIdx.length - 2 && anchorIdx[seg + 1] <= k) seg++;
    const i0 = anchorIdx[seg];
    const i1 = anchorIdx[seg + 1];
    const t0 = anchorT[seg];
    const t1 = anchorT[seg + 1];
    boundaries[k] = i1 === i0 ? t0 : t0 + ((t1 - t0) * (k - i0)) / (i1 - i0);
  }
  boundaries[n] = end;
  return boundaries;
}

/** Index of the active word at time `t`: the largest `k` with `boundaries[k] <= t`. */
export function activeIndex(boundaries: number[], t: number): number {
  let lo = 0;
  let hi = boundaries.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (boundaries[mid] <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  // boundaries has n+1 entries; valid word indices are 0..n-1.
  return Math.min(ans, boundaries.length - 2);
}
