// First-party, cookieless read-event tracking. Fires a tiny beacon to
// /api/read, which records the event in Cloudflare Analytics Engine. Only the
// node id and event type are sent — no cookies, no identifiers, no PII.
//
// Deduped per page-session so switching between node tabs doesn't re-count.

const sent = new Set<string>();

export type ReadEvent = "view" | "read" | "listen";

export function track(nodeId: string, event: ReadEvent): void {
  if (typeof navigator === "undefined" || !nodeId) return;
  const key = `${nodeId}:${event}`;
  if (sent.has(key)) return;
  sent.add(key);

  const body = JSON.stringify({ nodeId, event });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/read",
        new Blob([body], { type: "application/json" })
      );
    } else {
      void fetch("/api/read", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    // Analytics must never break the page.
  }
}
