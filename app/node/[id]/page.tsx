import { notFound } from "next/navigation";
import {
  getAllNodes,
  getExcerpt,
  buildGraphData,
  getCategories,
  getPhantomNodeIds,
} from "@/lib/content";
import type { Metadata } from "next";
import PageClient from "@/components/PageClient";

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
      };
    }
    return { title: "Not Found — Apeirron" };
  }

  const categories = getCategories();
  const category = categories.find(
    (c) => c.id === node.frontmatter.category
  );
  const description = getExcerpt(node.content);
  const title = `${node.frontmatter.title} — Apeirron`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Apeirron",
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: node.frontmatter.title }],
      tags: [
        category?.label ?? node.frontmatter.category,
        "knowledge graph",
        "deep dive",
        ...node.frontmatter.connections.map((c) => c.target),
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: node.frontmatter.title,
      description,
      images: ["/og.jpg"],
    },
  };
}

export default async function NodePage({ params }: Props) {
  const { id } = await params;
  const graphData = await buildGraphData();
  const node = graphData.nodes.find((n) => n.id === id);

  if (!node) notFound();

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: node.title,
    description: getExcerpt(
      getAllNodes().find((n) => n.frontmatter.id === id)?.content ?? ""
    ),
    url: `https://apeirron.com/node/${id}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Apeirron",
      url: "https://apeirron.com",
    },
    about: node.category,
    keywords: [
      node.category,
      ...graphData.links
        .filter(
          (l) =>
            (typeof l.source === "string" ? l.source : l.source) === id ||
            (typeof l.target === "string" ? l.target : l.target) === id
        )
        .map((l) => {
          const src =
            typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
          return src === id ? l.target : src;
        }),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageClient graphData={graphData} initialNodeId={id} />
    </>
  );
}
