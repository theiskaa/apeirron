# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "diffusers",
#     "torch",
#     "torchvision",
#     "transformers",
#     "accelerate",
#     "safetensors",
#     "sentencepiece",
#     "protobuf",
#     "pillow",
# ]
# ///

import argparse
import json
import re
from pathlib import Path

import torch
from diffusers import FluxPipeline
from PIL import Image, ImageChops, ImageOps

HERE = Path(__file__).resolve().parent
REPO = HERE.parent

MODEL = "black-forest-labs/FLUX.1-schnell"
DEFAULT_ACCENT = "#8a8f98"
BG = (0x1B, 0x1B, 0x1D)

STYLE = (
    "a single isolated subject centered on a plain solid white background, "
    "generous empty white margins, no scenery, no landscape, no ground, "
    "no cast shadow, antique copperplate engraving, fine cross-hatching and "
    "stippling, clean black ink line art, 19th-century scientific specimen "
    "illustration, highly detailed, no text, no lettering, no caption, no "
    "numbers, no border, no frame, not a photograph, no color"
)


def load_pipe():
    return FluxPipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16).to("mps")


def render(pipe, prompt, seed=7):
    g = torch.Generator(device="mps").manual_seed(seed)
    return pipe(
        prompt=f"{prompt}, {STYLE}",
        num_inference_steps=4,
        guidance_scale=0.0,
        height=1024,
        width=1024,
        max_sequence_length=256,
        generator=g,
    ).images[0]


def _hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def _lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _feather(size):
    grad = Image.radial_gradient("L").resize(size)
    return ImageOps.invert(grad).point(lambda v: min(255, int(v * 1.9)))


def _cutout(gray, accent):
    ink = ImageOps.invert(gray)
    alpha = ink.point(lambda v: 0 if v < 38 else min(255, int((v - 38) * 1.7)))
    alpha = ImageChops.multiply(alpha, _feather(gray.size))
    line = _lerp(accent, (255, 255, 255), 0.4)
    out = Image.new("RGBA", gray.size, line + (0,))
    out.putalpha(alpha)
    return out


def _plate(gray, accent):
    lo = _lerp(BG, (0, 0, 0), 0.3)
    hi = _lerp((120, 128, 138), accent, 0.5)
    r, g, b = [], [], []
    for v in range(256):
        c = _lerp(lo, hi, (v / 255) ** 0.9)
        r.append(c[0])
        g.append(c[1])
        b.append(c[2])
    return gray.convert("RGB").point(r + g + b)


def to_plate(img, color, style="cutout"):
    accent = _hex_rgb(color)
    gray = img.convert("L")
    w, h = gray.size
    gray = gray.crop((int(w * 0.04), int(h * 0.06), int(w * 0.96), int(h * 0.94)))
    gray = ImageOps.autocontrast(gray, cutoff=1)
    if style == "cutout":
        return _cutout(gray, accent)
    return _plate(gray, accent)


def _accent_for_node(node_id):
    meta = json.loads((REPO / "lib/generated/graph-metadata.json").read_text())
    for n in meta["nodes"]:
        if n["id"] == node_id:
            return n["color"]
    raise SystemExit(f"> [error]: node '{node_id}' not found in graph metadata")


def _slug(term):
    return re.sub(r"[^a-z0-9]+", "-", term.lower()).strip("-")


def _items(node_id):
    shots = HERE / "shots" / f"{node_id}.json"
    if shots.exists():
        return [
            (s["subject"], s.get("prompt") or s["subject"])
            for s in json.loads(shots.read_text())["shots"]
        ]
    cues = HERE / "cues" / f"{node_id}.json"
    if cues.exists():
        return [
            (c["term"], c.get("prompt") or c["term"])
            for c in json.loads(cues.read_text())["cues"]
            if c.get("time") is not None
        ]
    raise SystemExit(
        f"> [error]: no shots/ or cues/ for {node_id} — "
        f"run `node shots.mjs {node_id}` first"
    )


def batch(node_id, seed, style, force):
    accent = _accent_for_node(node_id)
    plates = HERE / "public" / "plates"
    plates.mkdir(parents=True, exist_ok=True)
    items = _items(node_id)
    print(f"> {len(items)} shots for {node_id} [{accent}]")

    pipe = None
    for subject, prompt in items:
        out = plates / f"{_slug(subject)}.png"
        if out.exists() and not force:
            print(f"  · {out.name} — cached")
            continue
        if pipe is None:
            print("> loading FLUX…")
            pipe = load_pipe()
        print(f"  + {out.name} — {prompt!r}")
        to_plate(render(pipe, prompt, seed), accent, style).save(out)
    print("> done")


def main():
    ap = argparse.ArgumentParser(description="Generate + tint Apeirron cue plates.")
    ap.add_argument("prompt", nargs="?")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--all", metavar="NODE", help="a plate for every cue of a node")
    ap.add_argument("--node")
    ap.add_argument("--accent")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--style", choices=["cutout", "plate"], default="cutout")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if args.all:
        batch(args.all, args.seed, args.style, args.force)
        return

    if not args.prompt or not args.out:
        ap.error("prompt and out are required (or use --all <node>)")
    accent = args.accent or (
        _accent_for_node(args.node) if args.node else DEFAULT_ACCENT
    )
    print(f"> generating (seed {args.seed})…")
    raw = render(load_pipe(), args.prompt, args.seed)
    print(f"> tinting {accent} [{args.style}]…")
    to_plate(raw, accent, args.style).save(args.out)
    print(f"> wrote {args.out}")


if __name__ == "__main__":
    main()
