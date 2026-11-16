# Contributing to Apeirron

Apeirron grows through community contributions. Every node is a Markdown file. Every connection is a link. If you have something worth exploring, we want it on the graph.

## Adding a new node

1. Fork the repository
2. Create a new `.md` file in `content/nodes/` — the filename becomes the URL slug (e.g., `dmt-entities.md`)
3. Add the required frontmatter (see below)
4. Write your content
5. Submit a Pull Request

## Frontmatter format

Every node file starts with YAML frontmatter:

```yaml
---
id: "dmt-entities"
title: "DMT Entities"
description: "An essay about reports of encounters during DMT experiences, what those reports share, and what they can establish."
category: "mind"
connections:
  - target: "altered-states"
    reason: "DMT can produce intense changes in perception, including reports of encounters with apparently autonomous beings."
  - target: "consciousness"
    reason: "These reports raise questions about how experience is generated; they do not by themselves establish independently existing entities."
---
```

**Fields:**

- `id` — unique identifier, lowercase with hyphens. Must match the filename (without `.md`).
- `title` — display name of the node.
- `description` — a short, accurate description of the essay's subject and focus, usually around 150–160 characters.
- `category` — an id from `content/categories.json`: `mind`, `origins`, `cosmos`, `power`, `operations`, `modern`, or `reality`.
- `connections` — usually 3–6 useful links for a new node. Each has a `target` and a short `reason` explaining a specific relationship. Existing connections should be reviewed deliberately when rewriting.

## Writing content

### The editorial bar

Read [the editorial standard](docs/editorial-standard.md). The house voice is plain and thoughtful: a clear point of view, concrete details, and room for doubt. Write a substantial essay, with enough explanation, historical context, evidence, and worked examples for the subject to be understood. There is no routine word ceiling. Develop a governing question and its supporting questions; link to neighboring essays for tangents and further depth.

There is no compulsory section template. Orient the reader, develop the evidence, examine the difficulty, and arrive at a conclusion proportionate to what the essay established. The format should serve the argument.

### What makes a good node

- **Focused and readable.** Give the reader a thread to follow. A story, worked example, or direct explanation can carry it. Do not tour every theory associated with the title.
- **Weigh the evidence.** Explain serious competing readings fairly, in proportion to their support. Separate what happened, what someone interprets it to mean, and what remains conjecture.
- **Make connections.** The real value of Apeirron is the web. Use `[[wiki links]]` throughout your text to connect to other nodes. Every link is a rabbit hole the reader can follow.
- **Choose concrete details.** Use the names, dates, and examples that help the reader understand the argument. Explain unfamiliar terms where they matter.
- **Write naturally.** Let sentences vary. Cut repeated conclusions, dramatic filler, and endings that inflate the stakes. Do not manufacture a personal voice with invented experiences.
- **Treat every topic seriously.** Whether it's the hard problem of consciousness or ancient astronaut theory, the tone is the same: genuine inquiry.

### What makes a bad node

- Bullet-point summaries with no depth
- Copy-pasted Wikipedia content
- One-sided advocacy or dismissal
- No connections to other nodes
- Sensationalist tone
- No verifiable sources

## Sources

Every node **must** end with a `## Sources` section. This is not optional. A node without verifiable sources will not be merged.

The purpose is simple: Apeirron maps ideas that are contested, speculative, and often dismissed. The only way to maintain credibility is to show your work. Every claim should be traceable to something a reader can verify independently.

### Format

```markdown
## Sources

- Chalmers, David. "Facing Up to the Problem of Consciousness." *Journal of Consciousness Studies*, 2(3), 1995. [PDF](https://example.com/link)
- Strassman, Rick. *DMT: The Spirit Molecule*. Park Street Press, 2000.
- Hancock, Graham. Interview on Younger Dryas impact. *Joe Rogan Experience* #1284, 2019. [YouTube at 1:22:15](https://youtube.com/watch?v=xxx&t=4935)
- Bank of England. "Money Creation in the Modern Economy." Quarterly Bulletin, Q1 2014. [Link](https://example.com)
```

### Requirements

- **Enough sources to support the actual essay.** A longer bibliography is not automatically better. Keep the sources used and cite important or contested claims inline.
- **Each source must be specific.** Not "some studies show" — the actual study, with author, title, and year.
- **Accepted source types:** academic papers, books (author + year), documentaries/videos (with timestamp), official documents, named interviews, investigative journalism (with publication name and date).
- **URLs are encouraged** but not required — books and papers don't always have free links.
- **Video sources must include timestamps** pointing to the relevant section, not just "watch this 3-hour documentary."

### Why this matters

Sources let readers check an account. A bibliography alone does not establish that the cited material supports the prose. PRs that add nodes without a Sources section will not be approved.

## Wiki links

Use `[[double brackets]]` to link to other nodes inline. You can reference by id or by title:

```markdown
This connects to [[consciousness]] and also to [[The Hard Problem]].
```

Both formats work; slugs are preferred. Links render as clickable inline references that open the target node. Check targets before adding them. Intentional forward references become proposed nodes; do not introduce them accidentally. The `[[slug|label]]` syntax is not supported.

## Categories

| ID | Label | Covers |
|----|-------|--------|
| `mind` | Mind | Consciousness, perception, altered states, the self, dreams, psychedelics |
| `origins` | Origins | Ancient civilizations, human evolution, lost history, megaliths, myths |
| `cosmos` | Cosmos | Aliens, Fermi paradox, UFOs, space, multiverse |
| `power` | Power | Control systems, banking, surveillance, secret societies, media |
| `operations` | Operations | Documented covert operations, intelligence programs, contested historical events |
| `modern` | Modern | Contemporary controversies, institutions, technology, and public claims |
| `reality` | Reality | Nature of existence, time, simulation theory, physics |

If you think a new category is needed, open an issue to discuss it before submitting a PR.

## Pull Request guidelines

- One node per PR (unless they're tightly related and should be reviewed together)
- Frontmatter must be valid YAML
- All `connections[].target` values should reference existing node ids (or nodes included in the same PR)
- Include useful `[[wiki links]]` where a neighboring essay provides context or takes over a tangent
- **Must include a `## Sources` section with at least one verifiable source**
- Run `npm run build` locally to verify the site builds without errors

**PRs without sources will not be merged.** This is the single non-negotiable rule.

## Improving existing nodes

Found a node that could be better? PRs to improve existing content are welcome. You can:

- Develop a section that needs explanation, or cut a tangent that obscures the essay's question
- Add connections that are missing
- Fix factual errors
- Improve the writing quality
- Add `[[wiki links]]` to newly created nodes

The reusable [write-node skill](.claude/skills/write-node/SKILL.md) covers the workflow for agents. The [editorial review](docs/editorial-review.md) explains the first batch; the [rewrite inventory](docs/node-rewrites.json) tracks all 198 nodes. When replacing an essay's body, withhold its old narration in `public/audio-manifest.json` until regenerated audio matches the text. Existing PDF/EPUB editions need separate regeneration.

## Questions?

Open an issue or start a discussion. The graph is infinite — there's room for every question worth asking.
