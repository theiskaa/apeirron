// OpenNext Cloudflare config.
// https://opennext.js.org/cloudflare/caching
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

export default defineCloudflareConfig({
  // Serve prerendered HTML/RSC from the NEXT_INC_CACHE_KV namespace (bound in
  // wrangler.jsonc) so the Worker barely executes per request — the backstop
  // against any future heavy page render. Fronted by a per-region in-memory
  // cache ("long-lived": reuse an SSG entry for up to 30 min) to cut KV reads,
  // which suits our pages — they only change on a new build/deploy.
  incrementalCache: withRegionalCache(kvIncrementalCache, { mode: "long-lived" }),
});
