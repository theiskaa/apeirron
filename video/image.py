# /// script
# requires-python = ">=3.11"
# dependencies = ["diffusers", "torch", "torchvision", "transformers", "accelerate", "safetensors", "pillow"]
# ///
# Full-bleed illustration generator for the vertical shorts. FLUX.1-schnell on
# Apple Silicon, rendered in one of the named looks below and graded so it fills
# the 9:16 frame in-palette. No API keys.
#
#   uv run image.py --prompts shorts/images/<id>-<slug>.json    # every cue → public/plates/
#   uv run image.py "<prompt>" out.png                          # a single one
#   … --style noir                                              # pick a look (default ink)

import argparse
import json
import os
import re
from pathlib import Path

import torch
from diffusers import FluxPipeline
from PIL import Image, ImageChops, ImageEnhance, ImageOps

HERE = Path(__file__).resolve().parent
MODEL = "black-forest-labs/FLUX.1-schnell"
PAPER = (0xF1, 0xEF, 0xEC)  # reeed --paper
INK = (0x2B, 0x2A, 0x28)  # reeed --ink
NOTXT = "no text, no lettering, no border, no frame, no watermark, no signature"

# Named looks for the TikTok page. `prompt` is the art-style suffix appended to
# each cue; `finish` names the post-processing in to_full (grade + film grain +
# vignette). --style selects one. `ink` is the signature brand look.
STYLES = {
    "ink": {
        "prompt": f"bold high-contrast ink and charcoal illustration, dramatic, graphic, striking, {NOTXT}",
        "finish": "ink",
    },
    "noir": {
        "prompt": f"dramatic high-contrast black and white photograph, deep shadows, film noir lighting, ominous, cinematic, hyper detailed, {NOTXT}",
        "finish": "noir",
    },
    "cinematic": {
        "prompt": f"cinematic film still, dramatic moody volumetric lighting, atmospheric haze, shallow depth of field, hyper detailed, {NOTXT}",
        "finish": "cinematic",
    },
    "painterly": {
        "prompt": f"lush painterly illustration, rich cinematic color palette that fits the subject and mood, soft volumetric lighting, atmospheric depth, delicate brushwork, ornate and beautiful, dramatic composition, {NOTXT}",
        "finish": "color",
    },
    "engraving": {
        "prompt": f"detailed graphite pencil sketch on textured sketchbook paper, expressive hand-drawn hatching, dramatic light and shadow, full-bleed drawing filling the frame edge to edge, {NOTXT}, no margins",
        "finish": "paper",
    },
}
DEFAULT_STYLE = "ink"


def _local_snapshot():
    # Find the already-downloaded FLUX snapshot in ANY standard HF cache dir,
    # regardless of how HF_HOME/HF_HUB_CACHE are set in the shell. This is why
    # you never need to authenticate: the model is local; we just have to look
    # in the right folder. Returns the snapshot path, or None if not cached.
    repo = "models--black-forest-labs--FLUX.1-schnell"
    roots = []
    if os.environ.get("HF_HUB_CACHE"):
        roots.append(Path(os.environ["HF_HUB_CACHE"]))
    if os.environ.get("HF_HOME"):
        roots.append(Path(os.environ["HF_HOME"]) / "hub")
    roots.append(Path.home() / ".cache" / "huggingface" / "hub")
    for root in roots:
        ref = root / repo / "refs" / "main"
        if ref.exists():
            snap = root / repo / "snapshots" / ref.read_text().strip()
            if (snap / "model_index.json").exists():
                return str(snap)
    return None


def load_pipe():
    # Load straight from the local snapshot folder when present (no network, no
    # gated-repo auth check). Only falls back to the Hub on a truly cold machine.
    snap = _local_snapshot()
    if snap:
        return FluxPipeline.from_pretrained(
            snap, torch_dtype=torch.bfloat16, local_files_only=True
        ).to("mps")
    return FluxPipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16).to("mps")


def render(pipe, prompt, style_prompt, seed=7):
    # Portrait 9:16, but kept near FLUX-schnell's ~1MP sweet spot (896x1568 =
    # 1.4MP). Pushing to 1024x1792 (1.83MP) at 4 steps makes schnell fall apart
    # into mush; a couple extra steps buys sharper line detail cheaply.
    g = torch.Generator("mps").manual_seed(seed)
    return pipe(
        prompt=f"{prompt}, {style_prompt}",
        num_inference_steps=6,
        guidance_scale=0.0,
        height=1568,
        width=896,
        max_sequence_length=256,
        generator=g,
    ).images[0]


# ---- finishing layer: what turns raw FLUX output into a branded, de-slopped look ----
def _grain(img, alpha):
    noise = Image.effect_noise(img.size, 26).convert("RGB")
    return Image.blend(img, ImageChops.overlay(img, noise), alpha)


def _vignette(img, darkness=0.30):
    mask = ImageOps.invert(Image.radial_gradient("L").resize(img.size))  # bright center -> dark edge
    return Image.composite(img, ImageEnhance.Brightness(img).enhance(darkness), mask)


def _duotone(gray, ink, paper):
    r, g, b = [], [], []
    for v in range(256):
        t = v / 255
        r.append(round(ink[0] + (paper[0] - ink[0]) * t))
        g.append(round(ink[1] + (paper[1] - ink[1]) * t))
        b.append(round(ink[2] + (paper[2] - ink[2]) * t))
    return gray.convert("RGB").point(r + g + b)


def _finish_ink(im):  # signature: crimson + black graphic, grain, vignette
    g = ImageOps.autocontrast(im.convert("L"), cutoff=1)
    return _vignette(_grain(_duotone(g, (17, 15, 17), (198, 52, 42)), 0.12), 0.26)


def _finish_noir(im):  # high-contrast black & white, grain, vignette
    g = ImageEnhance.Contrast(ImageOps.autocontrast(im.convert("L"), cutoff=1).convert("RGB")).enhance(1.25)
    return _vignette(_grain(g, 0.14), 0.22)


def _finish_cinematic(im):  # desaturated teal-shadow color grade, grain, vignette
    o = ImageEnhance.Contrast(ImageEnhance.Color(im.convert("RGB")).enhance(0.55)).enhance(1.18)
    o = ImageChops.soft_light(o, Image.new("RGB", im.size, (16, 58, 72)))
    return _vignette(_grain(o, 0.10), 0.32)


def _finish_color(im):  # keep FLUX's own palette, gentle tone-preserving autocontrast
    return ImageOps.autocontrast(im.convert("RGB"), cutoff=1, preserve_tone=True)


def _finish_paper(im):  # ink-on-cream duotone (pencil/engraving)
    return _duotone(ImageOps.autocontrast(im.convert("L"), cutoff=1), INK, PAPER)


FINISHES = {
    "ink": _finish_ink,
    "noir": _finish_noir,
    "cinematic": _finish_cinematic,
    "color": _finish_color,
    "paper": _finish_paper,
}


def to_full(img, finish):
    # No 2x upscale/heavy-sharpen: magnifying soft FLUX output turns it crunchy.
    # Keep native pixels; the video render supersamples at scale 1.5.
    return FINISHES[finish](img)


def _slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def batch(prompts_path, seed, force, style):
    look = STYLES[style]
    cues = json.loads(Path(prompts_path).read_text()).get("cues", [])
    uniq = {}
    for c in cues:
        uniq.setdefault(_slug(c["label"]), c.get("prompt") or c["label"])
    out_dir = HERE / "public" / "plates"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"> {len(uniq)} images ({style})")

    pipe = None
    for slug, prompt in uniq.items():
        out = out_dir / f"{slug}.png"
        if out.exists() and not force:
            continue
        if pipe is None:
            print("> loading FLUX…")
            pipe = load_pipe()
        print(f"  + {slug} — {prompt!r}")
        img = render(pipe, prompt, look["prompt"], seed)
        to_full(img, look["finish"]).save(out)
    print("> done")


def main():
    ap = argparse.ArgumentParser(description="Full-bleed shorts illustrations.")
    ap.add_argument("prompt", nargs="?")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--prompts", metavar="FILE")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--style", choices=STYLES, default=DEFAULT_STYLE)
    args = ap.parse_args()

    if args.prompts:
        batch(args.prompts, args.seed, args.force, args.style)
        return
    if not args.prompt or not args.out:
        ap.error("prompt and out are required (or use --prompts <file>)")
    look = STYLES[args.style]
    img = render(load_pipe(), args.prompt, look["prompt"], args.seed)
    to_full(img, look["finish"]).save(args.out)
    print(f"> wrote {args.out}")


if __name__ == "__main__":
    main()
