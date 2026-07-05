// Write 3-4 punchy vertical-short scripts from a node, with a LOCAL LLM (Ollama).
// Each is a self-contained ~40s hook: strong opening line, one gripping fact, a
// punchy button. Grounded in the node's article. No new deps, no API key.
//
//   node shorts.mjs <node-id> [--count 4] [--model qwen3.5:9b] [--force]
//
// Writes video/shorts/<id>.json. shortgen.mjs narrates + renders each.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const OLLAMA = "http://localhost:11434/api/chat";

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith("--"));
const force = argv.includes("--force");
const mIdx = argv.indexOf("--model");
const MODEL = mIdx >= 0 ? argv[mIdx + 1] : "qwen3.5:9b";
const nIdx = argv.indexOf("--count");
const COUNT = nIdx >= 0 ? Number(argv[nIdx + 1]) : 4;

if (!id) {
  console.error("usage: node shorts.mjs <node-id> [--count 4] [--model <name>] [--force]");
  process.exit(1);
}

function cleanText(md) {
  return md
    .replace(/^\s*---[\s\S]*?---\s*\n/, "")
    .replace(/\n#{1,6}\s*Sources\b[\s\S]*$/i, "")
    .replace(/\[\[([^\]]+)\]\]/g, (_, x) => x.split("|").pop().replace(/-/g, " "))
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const slug = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const SYSTEM = `You are a viral short-form video scriptwriter (YouTube Shorts, Reels, TikTok). From the article, write ${COUNT} DISTINCT self-contained short scripts, each about a different gripping idea from the article.
Each script MUST:
- Open with a HOOK in the first sentence: a sharp question or a bold, curiosity-provoking claim that stops the scroll.
- Deliver ONE fascinating idea, with a concrete specific fact or name from the article.
- Be spoken narration ONLY — no stage directions, no "in this video", no emojis, no hashtags.
- Be about 90 to 110 words (roughly 40 seconds when spoken).
- End on a punchy, thought-provoking closing line.
Voice: punchy, vivid, conversational, confident. Ground every claim in the article — do not invent facts.
Return ONLY JSON: {"shorts":[{"title":"3-6 word title","hook":"the opening sentence","script":"the full ~100 word narration"}]}`;

async function main() {
  const outPath = join(HERE, "shorts", `${id}.json`);
  if (existsSync(outPath) && !force) {
    console.log(`> shorts/${id}.json exists — pass --force to re-author`);
    return;
  }
  const md = readFileSync(join(REPO, "content/nodes", `${id}.md`), "utf8");
  const transcript = cleanText(md);

  console.log(`> ${MODEL}: writing ${COUNT} shorts…`);
  const res = await fetch(OLLAMA, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      format: "json",
      stream: false,
      think: false,
      options: { temperature: 0.7, num_ctx: 32768 },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `ARTICLE:\n\n${transcript}` },
      ],
    }),
  }).catch((e) => {
    throw new Error(`Ollama not reachable at ${OLLAMA} — is it running? (${e.message})`);
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

  const content = (await res.json()).message?.content || "";
  let parsed;
  for (const s of [content, (content.match(/\{[\s\S]*\}/) || [])[0]]) {
    if (!s) continue;
    try {
      parsed = JSON.parse(s);
      break;
    } catch {
      /* try next */
    }
  }
  if (!parsed) throw new Error("model did not return valid JSON — try again");

  const seen = new Set();
  const shorts = (parsed.shorts || [])
    .filter((s) => s && s.script && s.title)
    .map((s, i) => ({
      slug: slug(s.title) || `short-${i + 1}`,
      title: s.title.trim(),
      hook: (s.hook || s.script.split(/(?<=[.!?])\s/)[0]).trim(),
      script: s.script.trim(),
    }))
    .filter((s) => !seen.has(s.slug) && seen.add(s.slug));

  mkdirSync(join(HERE, "shorts"), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ id, shorts }, null, 2) + "\n");
  console.log(`> shorts/${id}.json — ${shorts.length} shorts:\n`);
  for (const s of shorts) {
    const words = s.script.split(/\s+/).length;
    console.log(`  [${s.slug}] ${s.title}  (~${words} words)`);
    console.log(`    ${s.script}\n`);
  }
}

main().catch((e) => {
  console.error(`> [error]: ${e.message}`);
  process.exit(1);
});
