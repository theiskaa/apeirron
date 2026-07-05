# /// script
# requires-python = ">=3.11"
# dependencies = ["diffusers", "torch", "torchvision", "transformers", "accelerate", "safetensors", "pillow"]
# ///
# Full-bleed illustration generator for the vertical shorts. SDXL-Turbo on Apple
# Silicon (~1s each), rendered as a dramatic engraving and duotoned onto the reeed
# paper so it fills the frame in-palette. No API keys.
#
#   uv run image.py --prompts shorts/images/<id>-<slug>.json    # every cue → public/plates/
#   uv run image.py "<prompt>" out.png                          # a single one

import argparse
import json
import re
from pathlib import Path

import torch
from diffusers import FluxPipeline
from PIL import Image, ImageOps, ImageFilter

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
    # Portrait 9:16 so the image is near-native resolution in the vertical frame
    # (a square would be upscaled ~1.9x to cover 1080x1920 and look soft).
    g = torch.Generator("mps").manual_seed(seed)
    return pipe(
        prompt=f"{prompt}, {STYLE}",
        num_inference_steps=4,
        guidance_scale=0.0,
        height=1792,
        width=1024,
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
    return upscale(gray.convert("RGB").point(r + g + b))


def upscale(rgb, factor=2):
    # 2x Lanczos + edge sharpen: crisp on high-DPI screens and gives headroom for
    # the ken-burns zoom, so the line art never looks soft in the frame.
    w, h = rgb.size
    big = rgb.resize((w * factor, h * factor), Image.LANCZOS)
    return big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=130, threshold=1))


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
    ap.add_argument("--upscale-existing", action="store_true",
                    help="2x any already-generated plates that are still low-res")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if args.upscale_existing:
        for f in sorted((HERE / "public" / "plates").glob("*.png")):
            im = Image.open(f)
            if im.width < 1500:
                upscale(im).save(f)
                print(f"  upscaled {f.name}")
        print("> done")
        return
    if args.prompts:
        batch(args.prompts, args.seed, args.force)
        return
    if not args.prompt or not args.out:
        ap.error("prompt and out are required (or use --prompts <file>)")
    to_full(render(load_pipe(), args.prompt, args.seed)).save(args.out)
    print(f"> wrote {args.out}")


if __name__ == "__main__":
    main()
