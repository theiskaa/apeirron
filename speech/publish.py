"""
Publish a node's narration: upload its MP3 to the Cloudflare R2 bucket and record
it in the site's audio manifest so the node page shows the "Listen" player. This
does NOT generate or encode anything — create the MP3 first with generate.py.

    uv run python generate.py ../content/nodes/consciousness.md consciousness.mp3
    uv run python publish.py consciousness

Usage (run from this directory):
    uv run python publish.py <node-id> [--file FILE]

By default it uploads <node-id>.mp3 from this directory. After it runs, commit
public/audio-manifest.json and redeploy so the site picks up the node.
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
MANIFEST = REPO / "public" / "audio-manifest.json"
PEAKS_DIR = REPO / "public" / "audio-peaks"
TIMINGS_DIR = REPO / "public" / "audio-timings"
BUCKET = "apeirron-audio"


def update_manifest(node_id: str) -> bool:
    ids = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []
    if node_id in ids:
        return False
    ids.append(node_id)
    ids.sort()
    MANIFEST.write_text(json.dumps(ids, indent=2) + "\n")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Upload a node's MP3 to R2 and add it to the audio manifest."
    )
    parser.add_argument("node_id", type=str)
    parser.add_argument(
        "--file",
        type=str,
        default=None,
        help="MP3 to upload (default: <node-id>.mp3 in this directory).",
    )
    args = parser.parse_args()

    mp3 = Path(args.file) if args.file else HERE / f"{args.node_id}.mp3"
    if not mp3.exists():
        sys.exit(f"> [error]: no audio at {mp3} — create it with generate.py first")

    key = f"{BUCKET}/{args.node_id}.mp3"
    print(f"> uploading {mp3.name} ({mp3.stat().st_size / 1e6:.1f} MB) to R2: {key}")
    subprocess.run(
        [
            "npx", "wrangler", "r2", "object", "put", key,
            "--file", str(mp3),
            "--content-type", "audio/mpeg",
            "--remote",
        ],
        check=True,
    )

    # The waveform sidecar (written by generate.py) is committed to the site so
    # the player renders instantly; the MP3 lives in R2, this stays in git.
    peaks_src = mp3.parent / (mp3.stem + ".peaks.json")
    if peaks_src.exists():
        PEAKS_DIR.mkdir(parents=True, exist_ok=True)
        dest = PEAKS_DIR / f"{args.node_id}.json"
        shutil.copyfile(peaks_src, dest)
        print(f"> wrote waveform to {dest.relative_to(REPO)}")
    else:
        print(f"> [warning]: no {peaks_src.name}; player will show a flat waveform")

    # The word-timing sidecar (written by generate.py) drives the "text follows
    # audio" reading mode; commit it alongside the waveform.
    timings_src = mp3.parent / (mp3.stem + ".timings.json")
    if timings_src.exists():
        TIMINGS_DIR.mkdir(parents=True, exist_ok=True)
        dest = TIMINGS_DIR / f"{args.node_id}.json"
        shutil.copyfile(timings_src, dest)
        print(f"> wrote word timings to {dest.relative_to(REPO)}")
    else:
        print(f"> [warning]: no {timings_src.name}; node won't offer follow-along")

    if update_manifest(args.node_id):
        print(f"> added '{args.node_id}' to {MANIFEST.relative_to(REPO)}")
    else:
        print(f"> '{args.node_id}' already in manifest")

    print("> done — commit public/audio-manifest.json and redeploy to publish it.")


if __name__ == "__main__":
    main()
