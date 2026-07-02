"""
Generate spoken-word audio from an Apeirron article using Kokoro TTS.

Uses the official Kokoro-82M model (hexgrad/kokoro). It runs locally on the CPU:
the 82M model is small and fast (~12x faster than real-time), so it does not pin
the machine the way the old XTTS pipeline did. Kokoro uses built-in preset voices;
it does not clone a reference recording. (Pass --device mps to try the Apple GPU,
though for a model this small the CPU is as fast and simpler.)

Usage (run from this directory):
    uv run python kokoro_gen.py <input.md> <output.wav> [--voice am_michael]

Example:
    uv run python kokoro_gen.py ../content/nodes/consciousness.md consciousness.wav

Suggested voices (male narrators):
    am_michael (default), am_puck, bm_daniel, bm_fable, bm_lewis

List all voices:
    uv run python kokoro_gen.py --list-voices

Requires the espeak-ng system package (brew install espeak-ng) for pronunciation
fallback. The model weights download automatically from Hugging Face on first run.
"""

import os

# Let unsupported ops fall back to CPU instead of erroring on MPS.
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

import re
import argparse

import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

SAMPLE_RATE = 24000  # Kokoro outputs 24 kHz audio
# Short silence inserted between sentences so the narration can breathe.
GAP = np.zeros(int(SAMPLE_RATE * 0.12), dtype=np.float32)

VOICES = {
    "american_female": ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky"],
    "american_male": ["am_adam", "am_michael", "am_puck"],
    "british_female": ["bf_emma", "bf_isabella"],
    "british_male": ["bm_george", "bm_lewis", "bm_daniel", "bm_fable"],
}


def clean_markdown(md_content: str) -> str:
    text = md_content
    # Strip YAML frontmatter (the --- ... --- block at the top) so the metadata
    # is not read aloud.
    text = re.sub(r"\A\s*---\s*\n.*?\n---\s*\n", "", text, count=1, flags=re.DOTALL)
    text = re.sub(r"\[\[.*?\]\]", "", text)
    text = re.sub(r"\[\^.*?\s*\]", "", text)
    text = re.sub(r"^(#{1,6})\s*", " ", text, flags=re.MULTILINE)
    text = re.sub(r"\n\s*[-*_]{3,}\s*\n", "\n", text)
    text = re.sub(r"(\*\*|__|\*|_)", " ", text)
    text = re.sub(r"\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def to_numpy(audio) -> np.ndarray:
    if isinstance(audio, torch.Tensor):
        audio = audio.detach().to("cpu").numpy()
    return np.asarray(audio, dtype=np.float32)


def generate_podcast_audio(
    md_file_path: str, output_wav_path: str, voice: str, device: str
):
    print("=" * 40)
    print("> starting Kokoro TTS generation")
    print("=" * 40)

    try:
        with open(md_file_path, "r", encoding="utf-8") as f:
            raw_markdown = f.read()
        print(f"> loaded content from: {md_file_path}")
    except FileNotFoundError:
        print(f"\n> [error]: input markdown file not found at '{md_file_path}'")
        return

    clean_text = clean_markdown(raw_markdown)
    if not clean_text:
        print("\n> [warning]: no readable text remained after cleaning markdown")
        return
    print(f"> markdown cleaned ({len(clean_text.split())} words)")

    lang_code = "b" if voice.startswith("b") else "a"
    print(f"> loading model on '{device}', voice '{voice}'...")
    pipeline = KPipeline(lang_code=lang_code, device=device)

    # clean_markdown collapses newlines, so split into sentences for the pipeline
    # rather than relying on its default newline splitter.
    chunks = []
    for result in pipeline(
        clean_text, voice=voice, speed=1.0, split_pattern=r"(?<=[.!?])\s+"
    ):
        if result.audio is None:
            continue
        chunks.append(to_numpy(result.audio))
        chunks.append(GAP)

    if not chunks:
        print("\n> [error]: model produced no audio")
        return

    audio = np.concatenate(chunks)
    sf.write(output_wav_path, audio, SAMPLE_RATE)
    duration = len(audio) / SAMPLE_RATE
    print(f"> podcast audio saved to {output_wav_path} ({duration/60:.1f} min)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate podcast audio from a markdown article using Kokoro TTS."
    )
    parser.add_argument("md_file_path", type=str, nargs="?")
    parser.add_argument("output_wav_path", type=str, nargs="?")
    parser.add_argument(
        "--voice",
        type=str,
        default="am_michael",
        help="Kokoro preset voice (default: am_michael)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cpu",
        choices=["cpu", "mps"],
        help="Compute device (default: cpu; for Kokoro it is as fast as mps and simpler)",
    )
    parser.add_argument(
        "--list-voices", action="store_true", help="List available voices and exit"
    )
    args = parser.parse_args()

    if args.list_voices:
        for group, names in VOICES.items():
            print(f"{group}: {', '.join(names)}")
        raise SystemExit(0)

    if not args.md_file_path or not args.output_wav_path:
        parser.error("md_file_path and output_wav_path are required")

    generate_podcast_audio(
        args.md_file_path, args.output_wav_path, args.voice, args.device
    )
