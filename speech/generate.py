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

Preview the cleaned/normalized text without synthesizing (fast, no model load):
    uv run python generate.py --check <input.md>

List all voices:
    uv run python generate.py --list-voices

Requires the espeak-ng system package (brew install espeak-ng) for pronunciation
fallback. The model weights download automatically from Hugging Face on first run.
"""

import os

# Let unsupported ops fall back to CPU instead of erroring on MPS.
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

import argparse
import json

import numpy as np
import soundfile as sf
import lameenc
import torch
from kokoro import KPipeline

from clean import clean_article

SAMPLE_RATE = 24000  # Kokoro outputs 24 kHz audio
# Short silence inserted between sentences so the narration can breathe.
GAP = np.zeros(int(SAMPLE_RATE * 0.12), dtype=np.float32)
# Exact duration of that gap in seconds — used to offset per-chunk word
# timestamps so they line up with the concatenated waveform.
GAP_SECONDS = len(GAP) / SAMPLE_RATE

VOICES = {
    "american_female": ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky"],
    "american_male": ["am_adam", "am_michael", "am_puck"],
    "british_female": ["bf_emma", "bf_isabella"],
    "british_male": ["bm_george", "bm_lewis", "bm_daniel", "bm_fable"],
}


def to_numpy(audio) -> np.ndarray:
    if isinstance(audio, torch.Tensor):
        audio = audio.detach().to("cpu").numpy()
    return np.asarray(audio, dtype=np.float32)


def words_from_result(result, offset: float) -> list:
    """Per-word [text, start, end] timestamps from one KPipeline result.

    Kokoro attaches per-token `start_ts`/`end_ts` (seconds, relative to THIS
    chunk's audio) when the model returns predicted durations. `offset` shifts
    them onto the concatenated timeline. Punctuation-only tokens are dropped so
    the stream is words the reader can see and follow.
    """
    out = []
    for t in getattr(result, "tokens", None) or []:
        start = getattr(t, "start_ts", None)
        end = getattr(t, "end_ts", None)
        text = (getattr(t, "text", None) or "").strip()
        if start is None or end is None or not any(c.isalnum() for c in text):
            continue
        out.append([text, round(offset + float(start), 3), round(offset + float(end), 3)])
    return out


def synth_words(pipeline: KPipeline, clean_text: str, voice: str, speed: float = 1.0):
    """Run a loaded pipeline over cleaned text → (waveform, word timings).

    Mirrors the concatenation in `synthesize`: each chunk's audio is followed by
    a GAP, and the running offset (chunk audio + gap) keeps word timestamps in
    lockstep with the final waveform. Returns (None, []) if nothing synthesized.
    """
    chunks, words, offset = [], [], 0.0
    for result in pipeline(clean_text, voice=voice, speed=speed):
        if result.audio is None:
            continue
        audio_np = to_numpy(result.audio)
        words.extend(words_from_result(result, offset))
        chunks.append(audio_np)
        chunks.append(GAP)
        offset += len(audio_np) / SAMPLE_RATE + GAP_SECONDS
    if not chunks:
        return None, []
    return np.concatenate(chunks), words


def synthesize(md_file_path: str, voice: str, device: str = "cpu"):
    """Render a node's Markdown to (waveform, word timings), or (None, []) on failure."""
    try:
        with open(md_file_path, "r", encoding="utf-8") as f:
            raw_markdown = f.read()
        print(f"> loaded content from: {md_file_path}")
    except FileNotFoundError:
        print(f"\n> [error]: input markdown file not found at '{md_file_path}'")
        return None, []

    clean_text = clean_article(raw_markdown)
    if not clean_text:
        print("\n> [warning]: no readable text remained after cleaning markdown")
        return None, []
    print(f"> markdown cleaned ({len(clean_text.split())} words)")

    lang_code = "b" if voice.startswith("b") else "a"
    print(f"> loading model on '{device}', voice '{voice}'...")
    pipeline = KPipeline(lang_code=lang_code, device=device)

    # clean_article keeps paragraph breaks; the pipeline's default split_pattern
    # (r"\n+") splits on them, and Kokoro chunks each paragraph at punctuation
    # under its own token budget — so names never break at their initials.
    audio, words = synth_words(pipeline, clean_text, voice)
    if audio is None:
        print("\n> [error]: model produced no audio")
        return None, []
    return audio, words


BITRATE = 64  # kbps, mono — ample for speech, ~0.5 MB/min
PEAK_COUNT = 120  # waveform resolution shown in the site's player


def compute_peaks(audio: np.ndarray, count: int = PEAK_COUNT) -> list:
    """Downsample the waveform to `count` normalized RMS peaks (0..1)."""
    seg = max(1, len(audio) // count)
    vals = []
    for i in range(count):
        chunk = audio[i * seg : (i + 1) * seg]
        vals.append(float(np.sqrt(np.mean(np.square(chunk)))) if len(chunk) else 0.0)
    peak = max(vals) or 1.0
    return [round(v / peak, 3) for v in vals]


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

    audio, words = synthesize(md_file_path, voice, device)
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

    # Sidecar the waveform peaks + exact duration for the site's player, so it
    # renders the waveform and correct length without decoding audio in-browser.
    stem = os.path.splitext(output_path)[0]
    peaks_path = stem + ".peaks.json"
    with open(peaks_path, "w", encoding="utf-8") as f:
        json.dump({"duration": round(duration, 2), "peaks": compute_peaks(audio)}, f)
    print(f"> wrote {peaks_path}")

    # Sidecar the per-word timestamps for the "text follows audio" reading mode.
    timings_path = stem + ".timings.json"
    with open(timings_path, "w", encoding="utf-8") as f:
        json.dump({"duration": round(duration, 2), "words": words}, f)
    print(f"> wrote {timings_path} ({len(words)} words)")


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
    parser.add_argument(
        "--check",
        action="store_true",
        help="Print the cleaned text, paragraph by paragraph, and exit (no synthesis).",
    )
    args = parser.parse_args()

    if args.list_voices:
        for group, names in VOICES.items():
            print(f"{group}: {', '.join(names)}")
        raise SystemExit(0)

    if args.check:
        if not args.md_file_path:
            parser.error("--check requires an input markdown file")
        with open(args.md_file_path, "r", encoding="utf-8") as f:
            paragraphs = clean_article(f.read()).split("\n")
        for i, p in enumerate(paragraphs, 1):
            print(f"[{i}] {p}\n")
        raise SystemExit(0)

    if not args.md_file_path or not args.output_path:
        parser.error("md_file_path and output_path are required")

    generate_podcast_audio(args.md_file_path, args.output_path, args.voice, args.device)
