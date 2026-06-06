import NotFoundView, { type SuggestedNode } from "@/components/NotFoundView";
import { getAllNodes, getCategories } from "@/lib/content";

// The full pool of nodes, each tagged with its category colour. The view
// picks 6 at random on the client, so a fresh set shows on every visit.
function buildPool(): SuggestedNode[] {
  const colorByCategory = new Map(getCategories().map((c) => [c.id, c.color]));
  return getAllNodes().map((n) => ({
    id: n.frontmatter.id,
    title: n.frontmatter.title,
    color: colorByCategory.get(n.frontmatter.category) ?? "var(--accent)",
  }));
}

export default function NotFound() {
  return <NotFoundView pool={buildPool()} />;
}
