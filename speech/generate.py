"""
Generate spoken-word audio from an Apeirron article using Kokoro TTS.

Uses the official Kokoro-82M model (hexgrad/kokoro). It runs locally on the CPU:
the 82M model is small and fast (~12x faster than real-time), so it does not pin
the machine the way the old XTTS pipeline did. Kokoro uses built-in preset voices;
it does not clone a reference recording. (Pass --device mps to try the Apple GPU,
though for a model this small the CPU is as fast and simpler.)

Usage (run from this directory) — writes MP3 (or WAV if the path ends in .wav):
    uv run python generate.py <input.md> <output.mp3> [--voice am_michael]

Example:
    uv run python generate.py ../content/nodes/consciousness.md consciousness.mp3

Suggested voices (male narrators):
    am_michael (default), am_puck, bm_daniel, bm_fable, bm_lewis

List all voices:
    uv run python generate.py --list-voices

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
import lameenc
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
    # Drop the Sources / bibliography section (always the last heading). Reading
    # citations, volume/page numbers, and URLs aloud makes for poor narration.
    text = re.sub(
        r"\n#{1,6}\s*Sources\b.*\Z", "", text, flags=re.DOTALL | re.IGNORECASE
    )
    # Wikilinks [[node-id]] render as the linked node's title on the site; for
    # speech, read the id as words (e.g. [[hard-problem]] -> "hard problem")
    # instead of deleting it and losing the word from the sentence.
    text = re.sub(
        r"\[\[([^\]]+)\]\]",
        lambda m: m.group(1).split("|")[-1].replace("-", " "),
        text,
    )
    text = re.sub(r"\[\^.*?\s*\]", "", text)  # footnote markers
    # Redundant symbol glosses like "phi (Φ)": the Greek letter is spoken as the
    # same word again ("phi phi"), so drop the parenthesized symbol.
    text = re.sub(r"\s*\([Ͱ-Ͽ]+\)", "", text)
    text = re.sub(r"^(#{1,6})\s*", " ", text, flags=re.MULTILINE)  # headings
    text = re.sub(r"\n\s*[-*_]{3,}\s*\n", "\n", text)  # horizontal rules
    text = re.sub(r"(\*\*|__|\*|_)", " ", text)  # bold / italic markers
    text = re.sub(r"\[.*?\]\(.*?\)", "", text)  # [text](url) links
    text = re.sub(r"\s*—\s*", ", ", text)  # em dash -> spoken pause
    text = re.sub(r"\s+", " ", text)  # collapse whitespace
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)  # tidy space-before-punctuation
    return text.strip()


def to_numpy(audio) -> np.ndarray:
    if isinstance(audio, torch.Tensor):
        audio = audio.detach().to("cpu").numpy()
    return np.asarray(audio, dtype=np.float32)


def synthesize(md_file_path: str, voice: str, device: str = "cpu"):
    """Render a node's Markdown to a mono float32 waveform, or None on failure.

    Shared by the WAV command-line path (generate_podcast_audio) and publish.py,
    which encodes the returned array straight to MP3.
    """
    try:
        with open(md_file_path, "r", encoding="utf-8") as f:
            raw_markdown = f.read()
        print(f"> loaded content from: {md_file_path}")
    except FileNotFoundError:
        print(f"\n> [error]: input markdown file not found at '{md_file_path}'")
        return None

    clean_text = clean_markdown(raw_markdown)
    if not clean_text:
        print("\n> [warning]: no readable text remained after cleaning markdown")
        return None
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
        return None

    return np.concatenate(chunks)


BITRATE = 64  # kbps, mono — ample for speech, ~0.5 MB/min


def encode_mp3(audio: np.ndarray, sample_rate: int) -> bytes:
    pcm = (np.clip(audio, -1.0, 1.0) * 32767.0).astype("<i2")
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(BITRATE)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(1)
    encoder.set_quality(2)  # 2 = high quality
    return encoder.encode(pcm.tobytes()) + encoder.flush()


def generate_podcast_audio(
    md_file_path: str, output_path: str, voice: str, device: str
):
    print("=" * 40)
    print("> starting Kokoro TTS generation")
    print("=" * 40)

    audio = synthesize(md_file_path, voice, device)
    if audio is None:
        return

    # MP3 by default (what ships to the web); WAV only if explicitly requested.
    if output_path.lower().endswith(".wav"):
        sf.write(output_path, audio, SAMPLE_RATE)
    else:
        with open(output_path, "wb") as f:
            f.write(encode_mp3(audio, SAMPLE_RATE))

    duration = len(audio) / SAMPLE_RATE
    print(f"> saved {output_path} ({duration / 60:.1f} min)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate podcast audio from a markdown article using Kokoro TTS."
    )
    parser.add_argument("md_file_path", type=str, nargs="?")
    parser.add_argument("output_path", type=str, nargs="?")
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

    if not args.md_file_path or not args.output_path:
        parser.error("md_file_path and output_path are required")

    generate_podcast_audio(args.md_file_path, args.output_path, args.voice, args.device)
