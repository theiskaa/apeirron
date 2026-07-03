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
