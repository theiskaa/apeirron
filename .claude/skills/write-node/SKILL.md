---
name: write-node
description: Write, review, or rewrite substantial Apeirron essays in content/nodes. Use for new nodes, editorial revisions, and corpus rewrites; covers the house voice, depth, evidence, graph connections, and three editorial review passes.
---

# Writing Apeirron

Write as someone who has spent time with a subject and has something worth showing the reader. The house voice is **plain, thoughtful, concrete, and willing to make a judgment**. Leave room for doubt where the evidence leaves room for it.

Apeirron publishes substantial essays. Make difficult material easier to follow while preserving its substance. There is no routine word ceiling. Cut repeated arguments and wandering associations; keep the context, methods, examples, and objections that make understanding possible. A polished introduction is not a finished essay.

Read [the editorial standard](../../../docs/editorial-standard.md) before drafting. Read the existing node in full, including its sources and connection reasons. For a new subject, search `content/nodes` for an essay that already owns the question. Expand that essay when a new node would only fragment it.

Honor the requested mode: a review-only request gets findings and proposed revisions, with no content changes unless authorized.

## Find the thread before the sentences

Make a short working brief: the governing question, what a new reader needs to know, the strongest evidence or examples, the serious difficulty, and the conclusion currently justified. These are private drafting notes, not a template to print above the essay.

A governing question gives a long essay direction. It does not forbid supporting questions or the history needed to understand them. A link to another node should offer further reading after a sufficient explanation here.

Choose the sequence that makes the subject intelligible. A history may need several closely examined episodes. A philosophical essay may need a worked example before terminology. An investigation may follow a document through the people and decisions behind it. Do not impose the same headings on all three.

The expanded `consciousness`, `mkultra`, and `gobekli-tepe` essays are calibration examples. Read the relevant one to judge the expected depth, not to copy its opening or rhythm. Much of the remaining corpus still needs revision; the existing collection is not automatically the house standard.

## Develop what matters

For an experiment, explain the setup, the observation, and the inference. Give the reader enough to understand why a competing explanation is plausible. For a historical episode, establish what happened, who could act, and how the account is known. For a theory, show how it handles a concrete case before explaining the objection that puts it under pressure.

Specificity is selective. A date earns its place when it establishes sequence or changes an interpretation. A technical term earns its place when an ordinary word would lose something. A detail earns its place when it helps the reader see the subject, rather than only see that research was done.

Keep curiosity alive. Present a compelling proposal in terms its proponent could recognize. Then examine its support. Do not replace sensationalism with a monotonous voice that says every possibility needs more evidence. Name the actual difficulty: a missing connection, a competing explanation, a measurement that cannot distinguish the claims.

Keep evidence, interpretation, and conjecture distinguishable in the prose. Place a qualification where it matters and give it the right weight. Once a limit is established, develop the argument instead of restating the caution in every paragraph. Fairness does not require equal space for unequal evidence.

## Give the prose a person’s judgment

Human character comes from what the writer notices, selects, explains, and concludes. Do not manufacture it with invented memories, an autobiographical “I,” slang, mistakes, or imitation of a named author. A real author’s supplied voice or experience can be retained when authorized and accurately represented.

Prefer exact, familiar language. Explain unfamiliar terms as they become useful. Let sentence length follow the thought: a short sentence can settle a point; a longer one can carry a qualification without turning it into a separate disclaimer. Paragraphs should develop a thought, not fit a uniform size.

Watch for writing that directs the reader’s reaction: dramatic superlatives, repeated reversals, rhetorical question chains, grand stakes, and announcements that a subject is fascinating. Replace the announcement with the thing worth noticing. Also cut editorial commentary such as “this is a better way to understand the issue” when the next sentence can simply explain it.

Transitions should show a relationship: an experiment creates a new problem, a later record changes an earlier account, or an objection forces a theory to explain more. A generic bridge could join any two subjects; rewrite it.

End at the last earned insight. State what has become clearer and the particular question that remains, when one remains. Do not finish every essay with a ritual declaration of mystery or an implication about all of reality.

## Review in three different ways

For a new or substantially rewritten essay, make three passes. Revise after each and reread the affected passages. If a later edit reintroduces an earlier problem, repeat that part of the review.

1. **Depth and structure.** Can the reader reconstruct the important events, experiments, and arguments? Find the thinnest essential section and develop it. Find a tangent or a repeated conclusion and resolve it. Do not confuse shorter with clearer, or longer with deeper.
2. **Voice and movement.** Read the prose aloud or attend to it sentence by sentence. Remove canned emphasis, repetitive qualifications, mechanical paragraph shapes, and passages that sound like an editor commenting on a draft. Check that each transition carries the thought forward. Preserve distinctive details and worthwhile complications.
3. **Evidence and consistency.** Trace consequential claims to sources. Check chronology, attribution, quotations, and the distinction between a proposal and a demonstrated result. Make descriptions and connection reasons agree with the essay. Inspect the final rendered structure when authorized.

These are reviews, not three automatic approvals. Record the substantive changes when reporting a large batch. Neither a readability score nor a successful build can establish that the writing is good.

## Sources are part of the account

Verify new or challenged facts using primary material when available. An inherited bibliography is a lead, not proof that its claims were checked. Attribute contested interpretations, distinguish a recollection from a contemporary record, and never invent quotations, scene details, page numbers, or bibliographic precision.

Cite evidence where the reader reasonably needs to inspect it. End with `## Sources`, retaining the works the essay actually uses. A book citation can be useful without a free link; a web citation should lead to the supporting document or passage. Name any material source limitation in the handoff rather than disguising it through confident prose.

## Keep the graph and publication intact

- Files live at `content/nodes/<id>.md`. Preserve existing ids, titles, categories, and URLs unless the assignment includes changing them. Match categories to `content/categories.json`.
- Frontmatter contains `id`, `title`, `description`, `category`, and `connections` entries with `target` and `reason`. Write an accurate description, usually around 150–160 characters, without clickbait or a claim to cover more than the essay does.
- Use `[[slug]]` links where the reader benefits. Check targets. `[[slug|label]]` is unsupported. Do not add links to meet a quota.
- A graph reason should name a specific historical, conceptual, evidential, or contrasting relationship. Do not invent causation to justify a connection. Review every outgoing reason when rewriting. Preserve targets by default; flag relationships that no longer earn their place. Check neighboring reasons when those nodes are in scope. The graph is undirected, so duplicating every edge is not a technical requirement.
- New nodes may need placement in `content/roadmap.json`; inspect its schema and `lib/roadmap.ts`. A body-only revision does not require a new reading path or graph image.
- Update [the rewrite inventory](../../../docs/node-rewrites.json) for corpus work. Mark a node rewritten only after reviewing the body, sources, description, and outgoing reasons. Report remaining scope accurately.
- After replacing a body, withhold its old narration from `public/audio-manifest.json` until new audio matches. Retain remote audio and timing assets. Flag PDF/EPUB regeneration separately.

Run the content generator and the normal project build after an appropriate batch. Check metadata, links, and Markdown structure. Respect the user’s browser and tool constraints; do not use Atlas when prohibited. Commit, deployment, audio publication, and publication-date changes are separate actions, not automatic consequences of writing.
