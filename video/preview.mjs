// Open the real node in Remotion Studio — a live browser preview where you scrub
// the timeline and every edit to the .tsx hot-reloads instantly, no video render.
// Iterate on the design here; only run generate.mjs once you're happy.
//
//   node preview.mjs <node-id>
//
// Stages the node's audio into public/ and writes its scene plan to a props file,
// then launches the studio (Ctrl-C to stop).

import {
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildScenePlan } from "./lib/scene-plan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const AUDIO_BASE = "https://audio.apeirron.com";

const id = process.argv[2];
if (!id) {
  console.error("usage: node preview.mjs <node-id>");
  process.exit(1);
}

const plan = buildScenePlan(id);

mkdirSync(join(HERE, "public"), { recursive: true });
const dest = join(HERE, "public", `${id}.mp3`);
const local = join(REPO, "speech", `${id}.mp3`);
if (existsSync(local)) {
  copyFileSync(local, dest);
} else if (!existsSync(dest)) {
  console.log(`> fetching audio ${AUDIO_BASE}/${id}.mp3`);
  const res = await fetch(`${AUDIO_BASE}/${id}.mp3`);
  if (!res.ok) throw new Error(`could not fetch audio (${res.status})`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}
plan.audioFile = `${id}.mp3`;

writeFileSync(join(HERE, ".preview-props.json"), JSON.stringify(plan));
console.log(`> ${id}: opening Remotion Studio at http://localhost:3000 (Ctrl-C to stop)`);
console.log("> edit src/*.tsx and it hot-reloads live — no render needed.\n");

spawnSync(
  "npx",
  ["remotion", "studio", "src/index.ts", "--props=.preview-props.json"],
  { cwd: HERE, stdio: "inherit" },
);
