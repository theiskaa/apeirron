export interface NodeConnection {
  target: string;
  reason: string;
}

export interface NodeFrontmatter {
  id: string;
  title: string;
  category: string;
  connections: NodeConnection[];
  /**
   * Optional hand-written SEO meta description (≈150–160 chars). When present it
   * overrides the auto-generated excerpt for the page's <meta description> and
   * social cards. See scripts/generate-content.mjs and app/node/[id]/page.tsx.
   */
  description?: string;
}

export interface NodeData {
  frontmatter: NodeFrontmatter;
  content: string;
  slug: string;
}

export interface Category {
  id: string;
  label: string;
  color: string;
}

export interface GraphNode {
  id: string;
  title: string;
  category: string;
  color: string;
  val: number;
  phantom?: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  reason: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * The "Read next" suggestion for a node — precomputed server-side (from the
 * global roadmap order) so node pages don't need the full graph to render it.
 * Mirrors the shape `ReadNext` builds in components/NodeView.tsx.
 */
export interface ReadNextData {
  node: GraphNode;
  kicker: string;
  label: string;
}
