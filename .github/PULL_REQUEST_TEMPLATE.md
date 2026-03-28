## What does this PR do?

<!-- Brief description: adding a new node, improving an existing one, fixing a bug, etc. -->

## Node checklist

If this PR adds or modifies content in `content/nodes/`:

- [ ] Frontmatter has valid `id`, `title`, `category`, and `connections`
- [ ] `id` matches the filename (without `.md`)
- [ ] `category` is one of: `mind`, `origins`, `cosmos`, `power`, `reality`
- [ ] All `connections[].target` values reference existing node ids
- [ ] Content includes `[[wiki links]]` to other nodes
- [ ] Both sides of the topic are presented fairly
- [ ] Tone is serious and research-oriented, not sensationalist
- [ ] `npm run build` passes locally

## Related issues

<!-- Link any related issues: Closes #123, Related to #456 -->
