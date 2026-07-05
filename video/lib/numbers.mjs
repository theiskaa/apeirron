// Detect "big-number moments" in the narration — the awe-sized quantities that
// deserve a beat of their own ("13.8 billion years", "100 to 400 billion stars",
// "two trillion galaxies"). We anchor on a magnitude word (million/billion/…)
// and grow left over the number/among connectors and right over one unit noun,
// so both digit numbers and spelled-out numbers are caught. Plain years like
// "1950" have no magnitude word and are intentionally ignored.

const MAG = new Set(["hundred", "thousand", "million", "billion", "trillion"]);
const CONNECT = new Set(["to", "and", "or", "point"]);
const NUMWORD = new Set([
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty",
  "seventy", "eighty", "ninety",
]);
const UNIT = new Set([
  "years", "year", "stars", "star", "planets", "planet", "galaxies", "galaxy",
  "civilizations", "civilization", "worlds", "world", "times", "kilometers",
  "miles",
]);

const norm = (t) => (t || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
const isDigit = (t) => /^\d[\d.,]*$/.test(t);
const isNumber = (t) => isDigit(t) || NUMWORD.has(norm(t));

const MIN_GAP = 7; // seconds between kept moments, so they never crowd

export function detectNumbers(words) {
  const moments = [];
  let lastEnd = -Infinity;

  for (let m = 0; m < words.length; m++) {
    if (!MAG.has(norm(words[m][0]))) continue;

    // grow left across numbers/connectors, right across more magnitudes/numbers
    let lo = m;
    while (lo > 0 && (isNumber(words[lo - 1][0]) || CONNECT.has(norm(words[lo - 1][0]))))
      lo--;
    let hi = m;
    while (
      hi + 1 < words.length &&
      (MAG.has(norm(words[hi + 1][0])) ||
        isNumber(words[hi + 1][0]) ||
        CONNECT.has(norm(words[hi + 1][0])))
    )
      hi++;

    // Require a clean DIGIT start (e.g. "13.8 billion", "100 million"). Spelled
    // ranges like "five and fifty million" read weakly as giant display type, so
    // we skip them rather than render them badly.
    if (!isDigit(words[lo][0])) continue;

    // optional single trailing unit noun
    let unit = "";
    let endIdx = hi;
    if (hi + 1 < words.length && UNIT.has(norm(words[hi + 1][0]))) {
      unit = words[hi + 1][0];
      endIdx = hi + 1;
    }

    const start = words[lo][1];
    if (start - lastEnd < MIN_GAP) {
      m = endIdx;
      continue;
    }
    // Value = the number span (without the unit), with "8 and 40" / "8 to 40"
    // collapsed to a clean range "8–40".
    const value = words
      .slice(lo, hi + 1)
      .map((w) => w[0])
      .join(" ")
      .replace(/\s+(?:and|to)\s+/g, "–");
    moments.push({ value, unit, start, end: words[endIdx][2] });
    lastEnd = words[endIdx][2];
    m = endIdx;
  }
  return moments;
}
