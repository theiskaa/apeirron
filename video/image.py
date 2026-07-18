# /// script
# requires-python = ">=3.11"
# dependencies = ["diffusers", "torch", "torchvision", "transformers", "accelerate", "safetensors", "pillow"]
# ///
# Full-bleed illustration generator for the vertical shorts. FLUX.1-schnell on
# Apple Silicon, rendered as a dramatic engraving and duotoned onto the reeed
# paper so it fills the 9:16 frame in-palette. No API keys.
#
#   uv run image.py --prompts shorts/images/<id>-<slug>.json    # every cue → public/plates/
#   uv run image.py "<prompt>" out.png                          # a single one

import argparse
import json
import re
from pathlib import Path

import torch
from diffusers import FluxPipeline
from PIL import ImageOps

HERE = Path(__file__).resolve().parent
MODEL = "black-forest-labs/FLUX.1-schnell"
PAPER = (0xF1, 0xEF, 0xEC)  # reeed --paper
INK = (0x2B, 0x2A, 0x28)  # reeed --ink

STYLE = (
    "dramatic full-frame vintage engraving illustration, detailed fine "
    "cross-hatching and stippling, bold black ink on white, 19th-century editorial "
    "and scientific illustration, cinematic dramatic composition, high contrast, "
    "no text, no lettering, no border, no frame"
)


def load_pipe():
    return FluxPipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16).to("mps")


def render(pipe, prompt, seed=7):
    # Portrait 9:16, but kept near FLUX-schnell's ~1MP sweet spot (896x1568 =
    # 1.4MP). Pushing to 1024x1792 (1.83MP) at 4 steps makes schnell fall apart
    # into mush; a couple extra steps buys sharper line detail cheaply.
    g = torch.Generator("mps").manual_seed(seed)
    return pipe(
        prompt=f"{prompt}, {STYLE}",
        num_inference_steps=6,
        guidance_scale=0.0,
        height=1568,
        width=896,
        max_sequence_length=256,
        generator=g,
    ).images[0]


def to_full(img):
    # Full-bleed: autocontrast for punch, then duotone black->ink / white->paper so
    # the engraving sits on the cream theme instead of pure white.
    gray = ImageOps.autocontrast(img.convert("L"), cutoff=1)
    r, g, b = [], [], []
    for v in range(256):
        t = v / 255
        r.append(round(INK[0] + (PAPER[0] - INK[0]) * t))
        g.append(round(INK[1] + (PAPER[1] - INK[1]) * t))
        b.append(round(INK[2] + (PAPER[2] - INK[2]) * t))
    # No 2x upscale/heavy-sharpen: magnifying soft FLUX output just turns it
    # crunchy. Keep the native pixels; the render supersamples at scale 1.5.
    return gray.convert("RGB").point(r + g + b)


def _slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def batch(prompts_path, seed, force):
    cues = json.loads(Path(prompts_path).read_text()).get("cues", [])
    uniq = {}
    for c in cues:
        uniq.setdefault(_slug(c["label"]), c.get("prompt") or c["label"])
    out_dir = HERE / "public" / "plates"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"> {len(uniq)} images")

    pipe = None
    for slug, prompt in uniq.items():
        out = out_dir / f"{slug}.png"
        if out.exists() and not force:
            continue
        if pipe is None:
            print("> loading FLUX…")
            pipe = load_pipe()
        print(f"  + {slug} — {prompt!r}")
        to_full(render(pipe, prompt, seed)).save(out)
    print("> done")


def main():
    ap = argparse.ArgumentParser(description="Full-bleed shorts illustrations.")
    ap.add_argument("prompt", nargs="?")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--prompts", metavar="FILE")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if args.prompts:
        batch(args.prompts, args.seed, args.force)
        return
    if not args.prompt or not args.out:
        ap.error("prompt and out are required (or use --prompts <file>)")
    to_full(render(load_pipe(), args.prompt, args.seed)).save(args.out)
    print(f"> wrote {args.out}")


if __name__ == "__main__":
    main()
