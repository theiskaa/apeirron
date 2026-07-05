// Assemble one short's render plan: its script metadata + Kokoro word timings +
// (stage 3) its image cues resolved to generated plates. Fed to the ShortVideo
// composition as inputProps.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const LIB = dirname(fileURLToPath(import.meta.url));
const VIDEO = join(LIB, "..");

const slug = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function buildShortPlan(id, wantSlug) {
  const meta = JSON.parse(readFileSync(join(VIDEO, "shorts", `${id}.json`), "utf8"));
  const short = meta.shorts.find((s) => s.slug === wantSlug);
  if (!short) throw new Error(`no short "${wantSlug}" in shorts/${id}.json`);

  const base = join(VIDEO, "shorts", "audio", `${id}-${short.slug}`);
  if (!existsSync(base + ".timings.json")) {
    throw new Error(`no timings for ${id}-${short.slug} — narrate it first`);
  }
  const timings = JSON.parse(readFileSync(base + ".timings.json", "utf8"));

  // Image cues (stage 3): montage/<id>-<slug>.json → resolve to public/plates/.
  const cuesPath = join(VIDEO, "shorts", "images", `${id}-${short.slug}.json`);
  let images = [];
  if (existsSync(cuesPath)) {
    images = (JSON.parse(readFileSync(cuesPath, "utf8")).cues || []).map((c) => {
      const rel = `plates/${slug(c.label)}.png`;
      return {
        time: c.time,
        asset: existsSync(join(VIDEO, "public", rel)) ? rel : null,
      };
    });
  }

  return {
    id,
    slug: short.slug,
    title: short.title,
    hook: short.hook || "",
    duration: timings.duration,
    words: timings.words || [],
    images,
    audioFile: null, // set by shortgen after staging into public/
  };
}
