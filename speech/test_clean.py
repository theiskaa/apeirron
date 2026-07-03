"""
Assertions for the narration text normalizer (clean.py). Run with:
    uv run python test_clean.py
"""

from clean import clean_article

FM = '---\nid: "x"\ntitle: "X"\n---\n\n'  # minimal frontmatter


def check(name, condition):
    assert condition, f"FAILED: {name}"
    print(f"ok  {name}")


def main():
    # Frontmatter is stripped.
    out = clean_article(FM + "Hello world.")
    check("frontmatter stripped", "title" not in out and out.startswith("Hello"))

    # Redundant Greek gloss "phi (Φ)" -> "phi" (no doubled word, no symbol left).
    out = clean_article(FM + "The quantity is phi (Φ), a measure.")
    check("phi gloss removed", "Φ" not in out and "phi, a measure" in out)

    # Wikilinks become spoken words.
    out = clean_article(FM + "See [[hard-problem]] here.")
    check("wikilink -> words", "hard problem" in out and "[" not in out)

    # Superscript footnote digits are removed.
    out = clean_article(FM + "A claim.¹ Next.")
    check("superscripts stripped", "¹" not in out)

    # Degrees expanded (misaki does not do this).
    out = clean_article(FM + "It was 37°C outside.")
    check("degrees expanded", "degrees Celsius" in out and "°" not in out)

    # Alphabetic slash -> "or"; numeric slash left alone for misaki.
    out = clean_article(FM + "The and/or case, open 24/7.")
    check("alpha slash -> or", "and or" in out and "24/7" in out)

    # The Sources section is dropped.
    out = clean_article(FM + "Body text here.\n\n## Sources\n\n- Nagel, T. 1974.")
    check("sources cut", "Nagel" not in out and "Body text here." in out)

    # Paragraph breaks are preserved so the Kokoro pipeline can split on them.
    out = clean_article(FM + "First para.\n\nSecond para.")
    check("paragraphs preserved", out == "First para.\nSecond para.")

    # Names with middle initials are NOT split — they stay intact on one line.
    out = clean_article(FM + "Work by Bernard J. Baars and Roger W. Sperry mattered.")
    check("initials intact, one line", "Bernard J. Baars" in out and "\n" not in out)

    # Em dashes become spoken pauses, not literal dashes.
    out = clean_article(FM + "Consciousness — the hard problem — persists.")
    check(
        "em dash -> pause",
        "—" not in out and "Consciousness, the hard problem, persists." in out,
    )

    print("\nAll normalizer checks passed.")


if __name__ == "__main__":
    main()
