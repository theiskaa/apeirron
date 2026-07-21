# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow"]
# ///
# Derive one caption palette per short from its already-generated plates, so the
# lyric colors match the imagery. Picks the dominant vivid hue as the accent and
# decides a light/dark caption treatment from overall brightness. PIL only — no
# torch, no model — so it runs instantly at render time (incl. --render-only).
#
#   uv run palette.py --prompts shorts/images/<id>-<slug>.json --out <id>-<slug>.palette.json

import argparse
import colorsys
import json
import re
import warnings
from pathlib import Path

from PIL import Image

warnings.filterwarnings("ignore", category=DeprecationWarning)

HERE = Path(__file__).resolve().parent


def _slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def _hex(rgb):
    return "#%02x%02x%02x" % tuple(rgb)


def analyze(paths):
    # Accumulate vivid colors into 24 hue buckets, weighted toward saturated
    # mid-tones; also track mean brightness to choose light vs dark captions.
    lum_sum, n = 0.0, 0
    buckets = {}
    for p in paths:
        im = Image.open(p).convert("RGB").resize((80, 142))
        for r, g, b in im.getdata():
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            lum_sum += l
            n += 1
            if s < 0.35 or l < 0.15 or l > 0.9:  # skip greys / near-black / near-white
                continue
            weight = s * (1 - abs(l - 0.55) * 1.4)  # favor vivid, well-lit tones
            if weight <= 0:
                continue
            acc = buckets.setdefault(int(h * 24), [0.0, 0.0, 0.0, 0.0])
            acc[0] += weight
            acc[1] += r * weight
            acc[2] += g * weight
            acc[3] += b * weight
    avg_lum = lum_sum / max(n, 1)
    if not buckets:
        return None, avg_lum
    w, rs, gs, bs = max(buckets.values(), key=lambda a: a[0])
    return (round(rs / w), round(gs / w), round(bs / w)), avg_lum


def vivify(rgb):
    # Push the accent bright + saturated enough to pop as the active-word color.
    h, l, s = colorsys.rgb_to_hls(*[c / 255 for c in rgb])
    s = min(1.0, max(s, 0.7))
    l = min(0.72, max(l, 0.6))
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return (round(r * 255), round(g * 255), round(b * 255))


def build(prompts_path):
    cues = json.loads(Path(prompts_path).read_text()).get("cues", [])
    plates = HERE / "public" / "plates"
    seen, paths = set(), []
    for c in cues:
        s = _slug(c["label"])
        if s in seen:
            continue
        seen.add(s)
        p = plates / f"{s}.png"
        if p.exists():
            paths.append(p)
    if not paths:
        return None
    accent, avg_lum = analyze(paths)
    accent = vivify(accent) if accent else (242, 182, 76)
    if avg_lum < 0.5:  # dark imagery → light captions on a dark scrim
        return {
            "accent": _hex(accent),
            "spoken": "#f4efe6",
            "unspoken": "#a79c8c",
            "scrim": "rgba(10,8,6,0.62)",
            "textShadow": "0 4px 30px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.55)",
            "bg": "#12100e",
            "endTitle": "#f6f1e8",
            "endSub": "#cabfae",
        }
    return {  # bright imagery → dark captions on a light scrim
        "accent": _hex(accent),
        "spoken": "#1c1a17",
        "unspoken": "#6b6459",
        "scrim": "rgba(245,242,236,0.82)",
        "textShadow": "0 2px 16px rgba(245,242,236,0.95)",
        "bg": "#efeae1",
        "endTitle": "#1c1a17",
        "endSub": "#5b5449",
    }


def main():
    ap = argparse.ArgumentParser(description="Per-short caption palette from plates.")
    ap.add_argument("--prompts", required=True, metavar="FILE")
    ap.add_argument("--out", required=True, metavar="FILE")
    args = ap.parse_args()
    theme = build(args.prompts)
    if theme is None:
        print("> palette: no plates found, skipping")
        return
    Path(args.out).write_text(json.dumps(theme, indent=2) + "\n")
    tone = "dark" if theme["bg"] == "#12100e" else "light"
    print(f"> palette: accent {theme['accent']} ({tone})")


if __name__ == "__main__":
    main()
