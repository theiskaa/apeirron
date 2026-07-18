// Match a phrase against the Kokoro word-timings stream. shorts.mjs uses this
// to anchor each image cue to the moment its anchor words are spoken.

// Lowercase and reduce to [a-z0-9]. "City's" -> "citys", "1950" -> "1950".
// Timings words carry stray apostrophes/punctuation; comparing on this canonical
// form makes the match robust to both sides' punctuation.
export function normalizeWord(w) {
  return (w || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Find where a phrase begins in the spoken stream. `stream` is [{norm, start}]
// (normalized timings words); `tokens` is the phrase's normalized tokens. We
// match on the CONCATENATED normalized text, not token-by-token, so a phrase
// tokenized differently on each side still lines up — e.g. the anchor tokens
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
