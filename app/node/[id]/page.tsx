import { notFound } from "next/navigation";
import {
  getAllNodes,
  getNodeDescription,
  buildGraphData,
  getCategories,
  getPhantomNodeIds,
  getNodeContent,
} from "@/lib/content";
import { getNodeGitDates } from "@/lib/git-dates";
import { buildRoadmapOrder } from "@/lib/roadmap";
import type { Metadata } from "next";
import type { ReadNextData } from "@/lib/types";
import Link from "next/link";
import PageClient from "@/components/PageClient";

const BASE_URL = "https://www.apeirron.com";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const nodes = getAllNodes();
  const phantomIds = getPhantomNodeIds();
  return [
    ...nodes.map((node) => ({ id: node.frontmatter.id })),
    ...phantomIds.map((id) => ({ id })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const nodes = getAllNodes();
  const node = nodes.find((n) => n.frontmatter.id === id);

  if (!node) {
    // Could be a phantom node
    const phantomIds = getPhantomNodeIds();
    if (phantomIds.includes(id)) {
      const title = id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return {
        title: `${title} — Apeirron`,
        description: `${title} is a proposed topic in the Apeirron knowledge graph. Contribute to help build this node.`,
        alternates: { canonical: `/node/${id}` },
        // Phantom nodes are unwritten stubs ("proposed topic — contribute").
        // Keep them crawlable/contributable but out of the index so they don't
        // register as thin pages as the graph grows.
        robots: { index: false, follow: true },
      };
    }
    return { title: "Not Found — Apeirron" };
  }

  const categories = getCategories();
  const category = categories.find(
    (c) => c.id === node.frontmatter.category
  );
  const description = getNodeDescription(node.slug);
  const title = `${node.frontmatter.title} — Apeirron`;
  const dates = getNodeGitDates(node.slug);

  return {
    title,
    description,
    alternates: { canonical: `/node/${id}` },
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Apeirron",
      publishedTime: dates.published.toISOString(),
      modifiedTime: dates.modified.toISOString(),
      tags: [
        category?.label ?? node.frontmatter.category,
        "knowledge graph",
        "deep dive",
        ...node.frontmatter.connections.map((c) => c.target),
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function NodePage({ params }: Props) {
  const { id } = await params;
  const graphData = await buildGraphData();
  const graphNode = graphData.nodes.find((n) => n.id === id);

  if (!graphNode) notFound();

  const sourceNode = getAllNodes().find((n) => n.frontmatter.id === id);
  const categories = getCategories();
  const category = categories.find((c) => c.id === graphNode.category);
  const description = sourceNode ? getNodeDescription(sourceNode.slug) : "";

  const dates = sourceNode ? getNodeGitDates(sourceNode.slug) : null;
  const activeContent = graphNode.phantom ? "" : await getNodeContent(id);
  // Full reciprocal connection set for this node, resolved to title + reason.
  // Built from the undirected graph links (NOT frontmatter.connections, which is
  // one-directional and would miss ~half the edges). Rendered server-side as an
  // sr-only anchor list below so crawlers/LLMs can follow connections without JS
  // — the visible interactive panel (NodeView) loads the graph client-side.
  const norm = (v: string | { id: string }) =>
    typeof v === "string" ? v : v.id;
  const nodeById = new Map(graphData.nodes.map((n) => [n.id, n]));
  const connections = graphData.links
    .filter((l) => norm(l.source) === id || norm(l.target) === id)
    .map((l) => {
      const otherId = norm(l.source) === id ? norm(l.target) : norm(l.source);
      return {
        id: otherId,
        title: nodeById.get(otherId)?.title ?? otherId,
        reason: l.reason,
      };
    });
  const connectedIds = connections.map((c) => c.id);

  // Tiny per-node payload for the interactive Connections panel (MiniGraph +
  // ConnectionReasons + phantom referencedBy). Those need only this node plus
  // its direct neighbors and the links among that set — a few KB — so node-page
  // visitors don't fetch the full ~292 KB graph.json unless they open the graph
  // canvas or navigate to a second node. (See PageClient's lazy loadFullGraph.)
  const includedIds = new Set<string>([id, ...connectedIds]);
  const neighborNodes = graphData.nodes.filter((n) => includedIds.has(n.id));
  const neighborLinks = graphData.links.filter(
    (l) => includedIds.has(norm(l.source)) && includedIds.has(norm(l.target))
  );

  // "Read next" follows the single global roadmap order. ReadNext normally
  // computes this from the full node set; precompute it here so the suggestion
  // renders without the full graph. Mirrors ReadNext's logic exactly.
  let readNext: ReadNextData | null = null;
  {
    const realNodes = graphData.nodes.filter((n) => !n.phantom);
    const { order, curatedCount } = buildRoadmapOrder(
      realNodes.map((n) => ({ id: n.id, weight: n.val }))
    );
    const idx = order.indexOf(id);
    if (idx !== -1 && idx < order.length - 1) {
      const nextNode = graphData.nodes.find((n) => n.id === order[idx + 1]);
      if (nextNode) {
        const onPath = idx + 1 < curatedCount;
        readNext = {
          node: nextNode,
          kicker: onPath ? "The Path" : "Beyond the path",
          label: onPath ? `${idx + 2} of ${curatedCount}` : "",
        };
      }
    }
  }

  const article: Record<string, unknown> = {
    "@type": "Article",
    "@id": `${BASE_URL}/node/${id}#article`,
    headline: graphNode.title,
    description,
    url: `${BASE_URL}/node/${id}`,
    mainEntityOfPage: `${BASE_URL}/node/${id}`,
    inLanguage: "en",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    publisher: { "@id": `${BASE_URL}/#organization` },
    author: { "@id": `${BASE_URL}/#editor` },
    image: {
      "@type": "ImageObject",
      // Per-node generated OG image (app/node/[id]/opengraph-image.tsx). The
      // route handler serves the PNG with or without Next's ?<hash> cache-bust
      // query, so the stable hashless path is safe to reference here.
      url: `${BASE_URL}/node/${id}/opengraph-image/default`,
      width: 1200,
      height: 630,
    },
    about: {
      "@type": "Thing",
      name: category?.label ?? graphNode.category,
    },
    keywords: [category?.label ?? graphNode.category, ...connectedIds],
  };

  if (dates) {
    article.datePublished = dates.published.toISOString();
    article.dateModified = dates.modified.toISOString();
  }

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    "@id": `${BASE_URL}/node/${id}#breadcrumbs`,
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
        name: category?.label ?? graphNode.category,
        item: `${BASE_URL}/nodes#category-${graphNode.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: graphNode.title,
        item: `${BASE_URL}/node/${id}`,
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [article, breadcrumbs],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageClient
        initialNodeId={id}
        initialNode={graphNode}
        initialContent={
          activeContent
            ? { nodeId: id, contentHtml: activeContent }
            : undefined
        }
        initialNeighbors={{ nodes: neighborNodes, links: neighborLinks }}
        initialReadNext={readNext}
      />

      {/*
        Server-rendered connection list. The interactive Connections panel loads
        the graph client-side (after hydration), so this sr-only block is what
        crawlers and non-JS LLM bots actually follow — the reasoned edges between
        nodes, with real <a href> anchors and the reason for each link.
      */}
      {connections.length > 0 && (
        <nav className="sr-only" aria-label={`Connections from ${graphNode.title}`}>
          <h2>Connected nodes</h2>
          <ul>
            {connections.map((c) => (
              <li key={c.id}>
                <Link href={`/node/${c.id}`} prefetch={false}>
                  {c.title}
                </Link>
                {c.reason ? ` — ${c.reason}` : ""}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
