// The small subset of speech/clean.py needed to line a heading up against the
// spoken word stream in public/audio-timings/<id>.json.
//
// clean.py strips the leading `##` but KEEPS the heading text, so every heading
// is narrated and appears — word for word — in the timings. To find where a
// section begins in the audio we tokenize its heading the same way Kokoro would
// have received it, then match that token run against the (normalized) timings.

// Lowercase and reduce to [a-z0-9]. "City's" -> "citys", "1950" -> "1950".
// Timings words carry stray apostrophes/punctuation; comparing on this canonical
// form makes the match robust to both sides' punctuation.
export function normalizeWord(w) {
  return (w || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Turn a raw Markdown heading line into the ordered, normalized word tokens the
// narrator would have spoken. Mirrors clean.py's _strip_structure for the pieces
// that occur in headings: drop the `#` markers, expand [[wiki-links]] to words,
// drop emphasis markers, then split on anything non-alphanumeric.
export function headingTokens(headingText) {
  let t = headingText
    .replace(/^\s{0,3}#{1,6}\s*/, "") // leading ## markers
    .replace(/\[\[([^\]]+)\]\]/g, (_, inner) =>
      inner.split("|").pop().replace(/-/g, " "),
    ) // [[hard-problem]] -> "hard problem"
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) -> text
    .replace(/[*_`]/g, " "); // emphasis / code markers
  return t
    .split(/[^A-Za-z0-9]+/)
    .map(normalizeWord)
    .filter(Boolean);
}

// Find where a phrase begins in the spoken stream. `stream` is [{norm, start}]
// (normalized timings words); `tokens` is the phrase's normalized tokens. We
// match on the CONCATENATED normalized text, not token-by-token, so a phrase
// tokenized differently on each side still lines up — e.g. the heading tokens
// ["post","2017"] vs the single spoken token "post-2017" both reduce to
// "post2017". Returns the start index in `stream`, or -1. Searches from `from`.
export function findPhraseStart(stream, tokens, from = 0) {
  const target = tokens.join("");
  if (!target) return -1;
  for (let i = from; i < stream.length; i++) {
    if (!stream[i].norm || !target.startsWith(stream[i].norm)) continue;
    let acc = "";
    for (let j = i; j < stream.length; j++) {
      acc += stream[j].norm;
      if (acc === target) return i;
      if (acc.length >= target.length || !target.startsWith(acc)) break;
    }
  }
  return -1;
}
