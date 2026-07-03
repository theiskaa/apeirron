"""
Text normalization for the Kokoro narration pipeline.

Turns an Apeirron node's raw Markdown into clean, narratable prose. The guiding
principle is "comprehensive but safe": fix what actually breaks narration, but do
NOT re-normalize what misaki (Kokoro's English G2P) already handles well —
integers, years, decades ("1960s" -> "nineteen sixties"), ordinals, decimals,
$/£/€ currency, the symbols % & + @ /, abbreviations like Dr./Mr./vs., and
letter-by-letter spelling of initials/acronyms. Re-doing those only adds errors.

Paragraph breaks are PRESERVED (as single newlines). generate.py passes the
result to KPipeline with its default split_pattern (r"\\n+"), and Kokoro chunks
each paragraph gracefully at punctuation under its 510-token budget. We do NOT
pre-split sentences ourselves — that is what used to break names like
"Bernard J. Baars" at the middle initial.

The pipeline is three stages: strip Markdown structure, normalize the few symbols
misaki misses, then normalize whitespace while keeping paragraph boundaries.
"""

import re

# Superscript footnote markers (¹²³⁰⁴⁵⁶⁷⁸⁹ ⁱ ⁿ) — reference digits that would
# otherwise be read aloud as numbers.
_SUPERSCRIPTS = "²³¹⁰ⁱ⁴⁵⁶⁷⁸⁹ⁿ"

# Decorative / astrological / arrow symbols that have no natural spoken form.
_DROP_SYMBOLS = "·•●♄☿♀♁♂♃♅♆∴→←↔↑↓"


def _strip_structure(text: str) -> str:
    # YAML frontmatter block at the very top.
    text = re.sub(r"\A\s*---\s*\n.*?\n---\s*\n", "", text, count=1, flags=re.DOTALL)
    # Trailing Sources / bibliography section (always the last heading) — reading
    # citations, volume/page numbers and URLs aloud makes for poor narration.
    text = re.sub(
        r"\n#{1,6}\s*Sources\b.*\Z", "", text, flags=re.DOTALL | re.IGNORECASE
    )
    # Wikilinks [[node-id]] render as the linked node's title on the site; for
    # speech, read the id as words ([[hard-problem]] -> "hard problem") rather
    # than deleting it and losing the word from the sentence. Keep any |display.
    text = re.sub(
        r"\[\[([^\]]+)\]\]",
        lambda m: m.group(1).split("|")[-1].replace("-", " "),
        text,
    )
    # Footnote reference markers [^1] and superscript footnote digits.
    text = re.sub(r"\[\^[^\]]*\]", "", text)
    text = re.sub(f"[{_SUPERSCRIPTS}]", "", text)
    # Images ![alt](url) — drop entirely (before links, so no stray "!" remains).
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
    # Links [text](url) -> just the text.
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    # Inline code / fences — keep the words, drop the backticks.
    text = re.sub(r"`+", "", text)
    # Line-level markers: headings, blockquotes, bullet lists, horizontal rules.
    text = re.sub(r"(?m)^\s{0,3}#{1,6}\s*", "", text)
    text = re.sub(r"(?m)^\s{0,3}>\s?", "", text)
    text = re.sub(r"(?m)^\s{0,3}[-*+]\s+", "", text)
    text = re.sub(r"(?m)^\s*[-*_]{3,}\s*$", "", text)
    # Bold / italic markers.
    text = re.sub(r"\*\*|__|\*|_", " ", text)
    # Any stray brackets left over from other markup.
    text = re.sub(r"[\[\]]", "", text)
    return text


def _normalize_symbols(text: str) -> str:
    # Degrees — misaki does not expand these.
    text = re.sub(r"°\s*C\b", " degrees Celsius", text)
    text = re.sub(r"°\s*F\b", " degrees Fahrenheit", text)
    text = re.sub(r"°", " degrees", text)
    # Smart quotes / apostrophes -> straight.
    text = text.translate(
        str.maketrans(
            {
                "‘": "'", "’": "'", "“": '"', "”": '"',
                "′": "'", "″": '"',
            }
        )
    )
    # Ellipsis and em/en dashes -> a spoken pause (misaki does not pause on them).
    text = re.sub(r"…|\.\.\.", ", ", text)
    text = re.sub(r"\s*[—–]\s*", ", ", text)
    # Redundant Greek-letter gloss like "phi (Φ)" — the letter is spoken as the
    # same word again ("phi phi"), so drop the parenthesized symbol.
    text = re.sub(r"\s*\([Ͱ-Ͽ]+\)", "", text)
    # Alphabetic a/b -> "a or b" (leave digit slashes: dates, ratios, "24/7").
    text = re.sub(r"(?<=[A-Za-z])\s*/\s*(?=[A-Za-z])", " or ", text)
    # A couple of math symbols with clear spoken forms.
    text = re.sub(r"\s*±\s*", " plus or minus ", text)
    text = re.sub(r"(?<=\d)\s*×\s*(?=\d)", " by ", text)
    text = re.sub(r"∞", " infinity ", text)
    # Remaining decorative symbols with no spoken form -> drop. (Accented Latin
    # letters in names — Cefalù, Encyclopædia — are deliberately left untouched.)
    text = re.sub(f"[{_DROP_SYMBOLS}]", " ", text)
    return text


def _normalize_whitespace(text: str) -> str:
    # Collapse runs of spaces/tabs (but not newlines).
    text = re.sub(r"[^\S\n]+", " ", text)
    # Tidy spaces left before punctuation by removed markup/symbols.
    text = re.sub(r" +([,.;:!?])", r"\1", text)
    # Collapse accidental repeated commas from dash/ellipsis substitution.
    text = re.sub(r"(,\s*){2,}", ", ", text)
    # Trim each line, drop blanks, and keep one newline between paragraphs so the
    # Kokoro pipeline can split on them.
    lines = [ln.strip() for ln in text.split("\n")]
    return "\n".join(ln for ln in lines if ln)


def clean_article(md: str) -> str:
    """Normalize a node's Markdown into paragraph-separated narratable text."""
    text = _strip_structure(md)
    text = _normalize_symbols(text)
    text = _normalize_whitespace(text)
    return text


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        sys.exit("usage: python clean.py <input.md>")
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        paragraphs = clean_article(f.read()).split("\n")
    for i, p in enumerate(paragraphs, 1):
        print(f"[{i}] {p}\n")
