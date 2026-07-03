import manifest from "@/public/audio-manifest.json";

// Pre-generated node narrations live in a Cloudflare R2 bucket exposed at this
// custom domain as `<AUDIO_BASE>/<node-id>.mp3`. Generated locally with the
// Kokoro pipeline in speech/ and published via speech/publish.py.
export const AUDIO_BASE = "https://audio.apeirron.com";

const withAudio = new Set(manifest as string[]);

/**
 * URL of a node's published narration, or null if none exists yet. The manifest
 * is updated by publish.py when a node's audio is uploaded, so a node only shows
 * the audio player once its file is actually live.
 */
export function nodeAudioUrl(id: string): string | null {
  return withAudio.has(id) ? `${AUDIO_BASE}/${id}.mp3` : null;
}

/**
 * URL of a node's per-word timing sidecar (start/end seconds per spoken word),
 * used by the "text follows audio" reading mode. Committed to the repo under
 * public/audio-timings/ by the speech pipeline; served as a static asset. Only
 * meaningful for nodes that have audio, and only present once the node's timings
 * have been generated (the fetch 404s gracefully until then).
 */
export function nodeTimingsUrl(id: string): string {
  return `/audio-timings/${id}.json`;
}

export interface NodeTimings {
  duration: number;
  /** [word, startSeconds, endSeconds] in narration order. */
  words: [string, number, number][];
}
