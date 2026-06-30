import { getCategories, getNodesForFeed } from "@/lib/content";

export const dynamic = "force-static";

const BASE_URL = "https://www.apeirron.com";

/** Escape the five XML predefined entities for safe inclusion in elements. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const nodes = getNodesForFeed();
  const categoryLabels = new Map(
    getCategories().map((c) => [c.id, c.label])
  );

  // Channel pubDate / lastBuildDate track the newest node (feed is sorted
  // newest-first), so a new node bumps the feed's freshness signal.
  const newest = nodes[0]
    ? new Date(nodes[0].publishedAt)
    : new Date(0);
  const buildDate = newest.toUTCString();

  const items = nodes
    .map((node) => {
      const url = `${BASE_URL}/node/${node.id}`;
      const pubDate = new Date(node.publishedAt).toUTCString();
      const category = categoryLabels.get(node.category) ?? node.category;
      return `    <item>
      <title>${esc(node.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${esc(category)}</category>
      <description>${esc(node.description)}</description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Apeirron</title>
    <link>${BASE_URL}</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>New nodes from Apeirron — an open-source knowledge graph mapping the biggest questions humanity asks. Newest additions first.</description>
    <language>en</language>
    <pubDate>${buildDate}</pubDate>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
