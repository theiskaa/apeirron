# SEO Tasks — apeirron.com

Derived from `seo.md` (2026-06-30 audit), **reconciled against the actual codebase**.
Tasks are ordered by execution sequence. Each task lists the file(s) to touch, the
change, and an acceptance check.

> **Audit corrections found during code review** — three audit items are already
> shipped or nearly so. They are kept here only as *verify* tasks, not builds:
> - **M2/T10 (per-node OG images):** `app/node/[id]/opengraph-image.tsx` already
>   generates per-node OG + Twitter images via the Next file convention. Only the
>   Article JSON-LD `image` is still hardcoded → see **B2**.
> - **L3 (Organization.sameAs → GitHub):** already present at `app/page.tsx:50`. ✅ done.
> - **H1 (server-rendered connection anchors):** `NodeView` SSRs `ConnectionReasons`,
>   `ReadNext`, and phantom `referencedBy` as real `next/link` anchors → see **B0**.
> - **T5 (force-graph lazy-load):** `Graph`/`MiniGraph` are already `dynamic(..., { ssr: false })`
>   (`PageClient.tsx:12`, `NodeView.tsx:9`). Remaining work is measurement only → see **B7**.

---

## Batch 0 — Verify the highest-value lever  ✅ VERIFIED DONE

### B0 — Node-to-node anchors are in the SSR HTML  *(H1 — verified, no action)*
- **Verified (2026-06-30)** against the prerendered build output
  `.next/server/app/node/consciousness.html`:
  - **38 distinct real `<a href="/node/...">` anchors** (the full connections list, SSR'd).
  - **35 server-rendered `<p>`** prose blocks (content ships in initial HTML).
  - 11 inline `data-node-link` cross-references in the prose on top of that.
- **Conclusion:** H1 is satisfied — crawlers and non-JS LLM bots follow every reasoned
  interconnection. No build needed.
- **Update:** the `perf(graph): load graph data client-side` refactor briefly regressed
  this (SSR anchors dropped 38 → 9, since the interactive Connections panel now hydrates
  client-side). **Fixed** by an additive `sr-only` server-rendered connection list in
  `app/node/[id]/page.tsx`, built from the undirected graph links (full reciprocal set +
  reasons). Live: consciousness 38, control-systems 54, shadow-elite 59 anchors restored.

---

## Batch 1 — Indexability quick wins  ✅ DONE

### B1a — Noindex phantom nodes  *(T1 / M1 — High)*  ✅
- **Done:** `robots: { index: false, follow: true }` on the phantom branch of
  `generateMetadata` (`app/node/[id]/page.tsx`). Runtime: phantom → `noindex, follow`,
  real nodes → `index, follow`.

### B1b — `dynamicParams = false`  *(T7 — Low)*  ✅
- **Done:** `export const dynamicParams = false;` in `app/node/[id]/page.tsx`.
  Runtime: `/node/__nope__` → `404`; real node, phantom, and `…/opengraph-image/default`
  all still `200`.

---

## Batch 2 — Per-node OG image in structured data  *(M2 / T10)*  ✅ DONE

### B2 — Point Article schema `image` at the per-node OG image
- **File:** `app/node/[id]/page.tsx` (the `article` object).
- **Done:** `image.url` now `${BASE_URL}/node/${id}/opengraph-image/default` (hashless
  path; the route handler serves the PNG regardless of Next's `?<hash>` cache-bust query).
  Verified in built HTML: `Article.image.url` is node-specific.
- **Post-deploy check:** `curl -sI https://www.apeirron.com/node/consciousness/opengraph-image/default`
  returns `200 image/png`.
- **Note:** `Organization.logo` keeping `/og.jpg` (`app/page.tsx`) is fine — brand logo, not per-page.

---

## Batch 3 — IndexNow  *(T4 — zero code)*

### B3 — Enable Cloudflare native IndexNow
- **Where:** Cloudflare Dashboard → Speed → Optimization → IndexNow (toggle on).
- **Acceptance:** after next deploy, response carries `x-indexnow` / Bing Webmaster shows submissions.

---

## Batch 4 — Content-Security-Policy  *(T2 — High, staged)*

### B4 — Add CSP, report-only first
- **File:** `next.config.mjs` → `headers()`.
- **Constraints:** must allow Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) and the
  two `dangerouslySetInnerHTML` sites (theme script in `app/layout.tsx:93`, JSON-LD scripts).
  JSON-LD needs `script-src` to permit inline `application/ld+json`; the theme `<script>` needs
  an inline allowance (nonce or hash preferred over `'unsafe-inline'`).
- **Step 1:** ship as `Content-Security-Policy-Report-Only` with a `report-uri`/`report-to`.
- **Step 2:** monitor reports, then switch the header key to `Content-Security-Policy` to enforce.
- **Acceptance:** report-only deployed with no console CSP errors on home + a node page; then enforced.

---

## Batch 5 — `next.config.mjs` headers pass  *(T6 / T8 / T9 — batch into one edit)*

### B5a — COOP/CORP hardening  *(T6)*  ✅ DONE
- **File:** `next.config.mjs` `headers()`.
- **Done:** added `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Resource-Policy: same-origin` (COEP intentionally omitted). Verified in
  routes manifest. Social OG previews unaffected (crawlers fetch server-side, not browser-CORP).

### B5b — Drop `X-Powered-By`  *(T8)*  ✅ DONE
- **Done:** `poweredByHeader: false` in `next.config.mjs`. Runtime: `X-Powered-By` absent.

### B5c — Replace dead FLoC directive  *(T9)*  ✅ DONE
- **Done:** `Permissions-Policy` now uses `browsing-topics=()` instead of `interest-cohort=()`.
  Runtime: header confirmed.

---

## Batch 6 — Cloudflare query-param cache hygiene  *(T3 — infra)*

### B6 — Strip query params on `/node/*`
- **Where:** Cloudflare Transform Rule (or `redirects()` to canonical) dropping query strings on `/node/*`.
- **Acceptance:** `/node/consciousness?foo=bar` no longer creates a distinct cache entry / 301s to clean URL.

---

## Batch 7 — E-E-A-T authorship  *(H2)*  ✅ DONE (shipped with the High batch)

### B7 — Add a named author signal
- **Done:** added site-wide `Person#editor` (name "Apeirron", `sameAs` GitHub) on `app/page.tsx`;
  node `Article.author` now refs `${BASE_URL}/#editor`, `publisher` stays `#organization`.
- **Soft note:** Person shares the org name (per user choice) — weaker real-name signal than a
  human name would give. Revisit if AI-citation lift is flat.

---

## Batch 8 — Performance field data  *(T5 — measure before optimizing)*

### B8 — Pull CrUX/PSI field data, then decide
- **Action:** run PageSpeed Insights + CrUX (`/seo google`) for mobile INP/LCP/CLS p75.
- **Decision gate:** if mobile INP p75 < 200 ms **and** LCP < 2.5 s → no perf work; close the flag.
- **If over budget:** `Graph` is already `ssr:false`; add `requestIdleCallback`-gated init and trim
  the 476 KB inline graph metadata.
- **Acceptance:** documented p75 numbers + go/no-go decision recorded.

---

## Batch 9 — Low-priority polish  *(backlog)*

### B9a — Meta-description spot-check  *(M3)*  ✅ REVIEWED — no fix needed
- **Reviewed all 181 nodes (decoded):** longest is exactly 160 chars, 0 empty, all end cleanly.
  `getExcerpt()` (`scripts/generate-content.mjs`) already truncates on a word boundary + ellipsis.
- **Optional later:** a frontmatter `summary` field for hand-tuned flagship descriptions — nice-to-have, not a defect.

### B9b — Align Twitter card title  *(L2)*  ✅ DONE
- **Done:** node `twitter.title` now uses the `— Apeirron` title. Built HTML:
  `twitter:title = "Consciousness — Apeirron"`.

### B9c — Drop homepage `keywords` meta  *(L1)*  ✅ DONE
- **Done:** removed the `keywords` array from `app/layout.tsx`. Built homepage has 0 keywords meta.

---

## Already verified done — no action  ✅
- **L3** — `Organization.sameAs: ["https://github.com/theiskaa/apeirron"]` (`app/page.tsx:50`).
- **Per-node OG/Twitter images** — `app/node/[id]/opengraph-image.tsx` (only schema image remains, B2).
- **Force-graph code-split** — `Graph`/`MiniGraph` are `dynamic(ssr:false)`.
- **Crawlability, canonicalization, sitemap, SSR content, real 404s, HSTS preload** — per audit.

---

## Suggested order
B0 → B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9
(B1/B2 are the same file; B4/B5 are the same file — batch the edits.)
