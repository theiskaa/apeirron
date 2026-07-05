// Auto-extract candidate "visual moments" from a node's Markdown: the phrases the
// author already marked as significant — **bold** terms and [[wiki-links]] — and
// pin each to the first second it is spoken (via the word timings). This is the
// data hook for the future "draw the concept when it's named" layer; today every
// cue ships with `asset: null` and the renderer skips it, so the output is pure
// kinetic typography until you start filling assets into video/cues/<id>.json.

import { headingTokens, normalizeWord, findPhraseStart } from "./clean-heading.mjs";

// First start-time at which the phrase is spoken, or null if the narration never
// says it verbatim (e.g. a bold term the prose paraphrases) — such cues are kept
// but stay unrenderable.
function firstSpokenTime(tokens, stream) {
  const i = findPhraseStart(stream, tokens);
  return i < 0 ? null : stream[i].start;
}

// Strip the frontmatter and the trailing Sources bibliography, then collect the
// unique bold/wikilink terms in document order.
function rawTerms(md) {
  const body = md
    .replace(/^\s*---\s*\n[\s\S]*?\n---\s*\n/, "")
    .replace(/\n#{1,6}\s*Sources\b[\s\S]*$/i, "");

  const terms = [];
  const seen = new Set();
  const push = (display, kind) => {
    const key = display.toLowerCase().trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    terms.push({ display: display.trim(), kind });
  };

  // [[node-id]] / [[node-id|Display]] — clean.py speaks the part after the pipe
  // (or the id with dashes as spaces), so that is the phrase to match on.
  for (const m of md.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const spoken = m[1].split("|").pop().replace(/-/g, " ");
    push(spoken, "link");
  }
  // **bold** — drop nested markup, skip trivially short marks.
  for (const m of body.matchAll(/\*\*([^*]+)\*\*/g)) {
    const text = m[1].replace(/\[\[|\]\]|[*_`]/g, "").trim();
    if (text.replace(/[^A-Za-z0-9]/g, "").length >= 3) push(text, "bold");
  }
  return terms;
}

export function extractCues(md, words) {
  const stream = words.map(([w, s]) => ({ norm: normalizeWord(w), start: s }));
  return rawTerms(md)
    .map(({ display, kind }) => ({
      term: display,
      kind,
      time: firstSpokenTime(headingTokens(display), stream),
      asset: null,
    }))
    .sort((a, b) => {
      // Spoken cues first, in time order; unmatched ones trail at the end.
      if (a.time == null) return b.time == null ? 0 : 1;
      if (b.time == null) return -1;
      return a.time - b.time;
    });
}
