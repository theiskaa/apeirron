import { NextResponse } from "next/server";
import { getAllNodes, getPhantomNodeIds } from "@/lib/content";

// First-party read analytics. Records anonymous, aggregate per-node events
// (view / read / listen) into Cloudflare Analytics Engine. Stores only the node
// id and event type — no IP, no cookies, no identifiers.

const EVENTS = new Set(["view", "read", "listen"]);

interface AnalyticsEngineDataset {
  writeDataPoint: (point: {
    indexes?: string[];
    blobs?: string[];
    doubles?: number[];
  }) => void;
}

export async function POST(req: Request): Promise<NextResponse> {
  // Always 204 — this is a fire-and-forget beacon; the client ignores the body.
  const ok = new NextResponse(null, { status: 204 });

  let body: { nodeId?: string; event?: string };
  try {
    body = await req.json();
  } catch {
    return ok;
  }

  const nodeId = typeof body?.nodeId === "string" ? body.nodeId : "";
  const event = typeof body?.event === "string" ? body.event : "";

  // Reject anything that isn't a known event for a known node, so the dataset
  // can't be polluted with arbitrary values.
  const knownNode =
    !!nodeId &&
    (getAllNodes().some((n) => n.frontmatter.id === nodeId) ||
      getPhantomNodeIds().includes(nodeId));
  if (!EVENTS.has(event) || !knownNode) return ok;

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as {
      READ_EVENTS?: AnalyticsEngineDataset;
    };
    env.READ_EVENTS?.writeDataPoint({
      indexes: [nodeId],
      blobs: [event],
      doubles: [1],
    });
  } catch {
    // Not on the Cloudflare runtime (e.g. `next start`) — no-op.
  }

  return ok;
}
