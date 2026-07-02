# Apeirron

> *apeiron (ἄπειρον)* — ancient Greek for "the infinite, the boundless, the undefined origin of all things."

An interactive knowledge graph mapping the biggest questions humanity asks — consciousness, ancient civilizations, the nature of reality, hidden power structures, the cosmos and many more — as interconnected nodes in a visual web.

![Apeirron Graph](public/apeirron-graph.svg)

Every idea is a node. Every node links to others. Every connection has a reason. The result is a web of thought where nothing exists in isolation.
## How it works

The site is a force-directed graph. Each node is a topic — written as a narrative deep-dive, not a Wikipedia summary. Click a node to read it. Follow `[[links]]` in the text to fall deeper into the rabbit hole. The graph grows as contributors add new nodes through Pull Requests.

All content lives as Markdown files in the [`content/nodes/`](./content/nodes) directory. The graph, connections, and site are generated automatically from these files at build time. No database, no CMS — just Markdown and Git.

## RSS feed

New nodes are published to an RSS feed at [`/feed.xml`](https://www.apeirron.com/feed.xml), ordered by date added with the newest node on top. Subscribe to follow the graph as it grows.

## Books

The same content is also available as a typeset edition: seven EPUB and PDF volumes, one per category, generated from the same nodes. See [`books/`](./books) for the build pipeline and details.

<a href="books/apeirron-mind.pdf"><img src="public/books/cover-mind.png" alt="Mind" width="110"></a> <a href="books/apeirron-origins.pdf"><img src="public/books/cover-origins.png" alt="Origins" width="110"></a> <a href="books/apeirron-cosmos.pdf"><img src="public/books/cover-cosmos.png" alt="Cosmos" width="110"></a> <a href="books/apeirron-power.pdf"><img src="public/books/cover-power.png" alt="Power" width="110"></a> <a href="books/apeirron-operations.pdf"><img src="public/books/cover-operations.png" alt="Operations" width="110"></a> <a href="books/apeirron-modern.pdf"><img src="public/books/cover-modern.png" alt="Modern" width="110"></a> <a href="books/apeirron-reality.pdf"><img src="public/books/cover-reality.png" alt="Reality" width="110"></a>


## Audio narration

Any node can be turned into spoken-word audio. The [`speech/`](./speech) directory holds a small local text-to-speech pipeline built on [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0): it strips a node's Markdown down to clean prose and narrates it in a natural voice. Synthesis runs locally on the CPU — no API keys, no cost, and no text ever leaves your machine — and the 82M model generates roughly 12× faster than real-time.

```bash
cd speech
uv sync                       # one-time setup (also: brew install espeak-ng)
uv run python kokoro_gen.py ../content/nodes/consciousness.md consciousness.wav
```

Choose a narrator with `--voice` (suggested: `am_michael` (default), `am_puck`, `bm_daniel`, `bm_fable`, `bm_lewis`); run `--list-voices` to see them all.

> **Gotcha — the Hugging Face network check.** On first run the model weights download from Hugging Face and are cached. After that, `huggingface_hub` still pings the Hub each run to check for updates — a metadata check about the public model only, never your content — which surfaces as a `unauthenticated requests to the HF Hub` warning. To skip it and run fully offline once the model is cached, prefix the command with `HF_HUB_OFFLINE=1` (the only catch: offline mode can't fetch a voice you haven't used before).

## Contributing

Apeirron is open to contributions. You can:

- **Add a new node** — write a deep-dive on a topic and submit a PR
- **Improve an existing node** — better writing, more connections, factual corrections
- **Propose a topic** — open an issue if you have an idea but don't want to write it yourself

Every node must include verifiable sources — books, papers, videos with timestamps, or official documents. PRs without sources will not be merged.

Read the [Contributing Guide](./CONTRIBUTING.md) for details on how to write a node, how connections work, and what makes a good submission.
