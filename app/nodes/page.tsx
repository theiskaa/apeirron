import type { Metadata } from "next";
import {
  getAllNodes,
  getCategories,
  getNodeExcerpt,
  getNodeWeights,
} from "@/lib/content";
import NodesView from "@/components/NodesView";
import { buildRoadmapOrder } from "@/lib/roadmap";

const BASE_URL = "https://www.apeirron.com";

// Subject blurbs per category — what reads beside each volume's label.
// Editorial, not generated, so hardcoded.
const VOLUME_DESCRIPTIONS: Record<string, string> = {
  mind: "Consciousness, philosophy of mind, altered states, philosophical traditions.",
  origins: "Pre-history, lost civilizations, ancient mysteries, esoteric tradition.",
  cosmos: "UFOs, UAPs, the Fermi paradox, the Pentagon disclosure arc.",
  power: "Hidden power structures, secret societies, the deep state, dynastic finance.",
  operations: "Documented intelligence operations, assassinations, false flags.",
  modern: "Twenty-first-century cases, contested deaths, contemporary disinformation.",
  reality: "Foundational physics, the Mandela effect, the simulation hypothesis, flat-earth epistemology.",
};

export const metadata: Metadata = {
  title: "All nodes — Apeirron",
  description:
    "Every topic in the Apeirron knowledge graph, grouped by category — consciousness, ancient civilizations, intelligence operations, reality, and more.",
  alternates: { canonical: "/nodes" },
  openGraph: {
    title: "All nodes — Apeirron",
    description:
      "Every topic in the Apeirron knowledge graph, grouped by category.",
    type: "website",
    siteName: "Apeirron",
  },
};

export default function NodesIndexPage() {
  const nodes = getAllNodes();
  const categories = getCategories();

  const byCategory = new Map<string, typeof nodes>();
  for (const node of nodes) {
    const key = node.frontmatter.category;
    const list = byCategory.get(key) ?? [];
    list.push(node);
    byCategory.set(key, list);
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));
  }

  const groups = categories
    .filter((c) => byCategory.has(c.id))
    .map((category) => ({
      category,
      nodes: byCategory.get(category.id)!.map((n) => ({
        id: n.frontmatter.id,
        title: n.frontmatter.title,
        excerpt: getNodeExcerpt(n.slug),
        connectionCount: n.frontmatter.connections.length,
      })),
    }));

  const flatNodes = groups.flatMap((g) => g.nodes);

  // Roadmap ("zero to hero") — a curated, ordered reading path that weaves
  // across categories. The shared helper places the curated path (content/
  // roadmap.json) first, then every remaining node by connectivity. Using the
  // same helper + the same `val` weights the client uses keeps this order
  // identical to the per-node "Read next" suggestion. The view renders the
  // curated head as a numbered path and the tail as a "beyond the path" grid.
  const catById = new Map(categories.map((c) => [c.id, c]));
  const nodeById = new Map(nodes.map((n) => [n.frontmatter.id, n]));
  const weights = getNodeWeights();
  const { order: roadmapOrder, curatedCount: roadmapCuratedCount } =
    buildRoadmapOrder(
      nodes.map((n) => ({
        id: n.frontmatter.id,
        weight: weights.get(n.frontmatter.id) ?? n.frontmatter.connections.length,
      }))
    );
  const roadmapNodes = roadmapOrder.map((id) => {
    const n = nodeById.get(id)!;
    const cat = catById.get(n.frontmatter.category);
    return {
      id: n.frontmatter.id,
      title: n.frontmatter.title,
      excerpt: getNodeExcerpt(n.slug),
      connectionCount: n.frontmatter.connections.length,
      categoryLabel: cat?.label ?? n.frontmatter.category,
      categoryColor: cat?.color ?? "var(--text-muted)",
    };
  });

  // One typeset volume per category that has nodes; chapters = node count.
  const volumes = groups.map(({ category, nodes }) => ({
    id: category.id,
    label: category.label,
    description: VOLUME_DESCRIPTIONS[category.id] ?? "",
    chapters: nodes.length,
  }));

  const collectionPage = {
    "@type": "CollectionPage",
    "@id": `${BASE_URL}/nodes#collectionpage`,
    url: `${BASE_URL}/nodes`,
    name: "All nodes — Apeirron",
    description:
      "Every topic in the Apeirron knowledge graph, grouped by category.",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    inLanguage: "en",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: flatNodes.length,
      itemListElement: flatNodes.map((n, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/node/${n.id}`,
        name: n.title,
        description: n.excerpt,
      })),
    },
  };

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    "@id": `${BASE_URL}/nodes#breadcrumbs`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${BASE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "All nodes",
        item: `${BASE_URL}/nodes`,
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [collectionPage, breadcrumbs],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NodesView
        groups={groups}
        totalCount={nodes.length}
        volumes={volumes}
        roadmap={roadmapNodes}
        roadmapCuratedCount={roadmapCuratedCount}
      />
    </>
  );
}
