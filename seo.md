# 🔍 SEO Audit — apeirron.com

**Site type:** Publisher / knowledge base (open-source knowledge graph, 179 nodes)
**Stack:** Next.js 16 + React 19, statically generated, Cloudflare/OpenNext edge
**Audit date:** 2026-06-29 (full audit) · 2026-06-30 (technical deep-dive added)

## SEO Health Score: **86 / 100** — Excellent

> Revised from 88 → 86 after the technical deep-dive lowered the Technical SEO sub-score (missing CSP, indexable phantom nodes, no IndexNow). Still excellent; nothing blocks indexing.

| Category | Weight | Score | Notes |
|---|---|---|---|
| Technical SEO | 22% | 87 | SSG, 301 canonicalization, clean sitemap/robots — but CSP missing & phantom nodes indexable (see deep-dive) |
| Content Quality | 23% | 82 | Long-form, primary-sourced, server-rendered — but org-only authorship |
| On-Page SEO | 20% | 88 | Strong titles/descriptions/canonicals; generic OG per node |
| Schema | 10% | 92 | Article + Breadcrumb + WebSite + Organization + CollectionPage |
| Performance (CWV) | 10% | 75 | 476 KB/page; force-graph hydration → INP risk (field data not pulled) |
| AI Search Readiness | 10% | 96 | Best-in-class: AI bots allowed, llms.txt, SSR content |
| Images | 5% | 80 | OG present; no per-node social images |

---

## ✅ What's already done right (don't touch)

- **Content is server-rendered, not JS-gated.** The full article prose ships in the initial HTML (verified: 34 `<p>` server-rendered on `/node/consciousness`). This is the single most important thing for a knowledge site — **AI crawlers that don't execute JS still see your full text.**
- **AI-search posture is exemplary.** `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, CCBot, Google-Extended; `llms.txt` is well-structured with per-node excerpts.
- **Canonicalization is correct.** `apeirron.com` → `https://www.apeirron.com` 301, canonical tags match, `Host` directive set.
- **Security headers strong:** HSTS w/ `preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, **and `Permissions-Policy`** (camera/mic/geolocation locked). Gap: no CSP (see T2 in deep-dive).
- **Per-node structured data:** `Article` + `BreadcrumbList` in a `@graph`, wired to `WebSite`/`Organization` via `@id` refs, with `datePublished`/`dateModified` from git history.
- **Clean sitemap:** 183 URLs (4 static + 179 nodes), `lastmod` per node, **no phantom-node bloat.**

This is a genuinely well-engineered site. The findings below are optimizations, not fixes — **nothing blocks indexing.**

---

## 🟠 High Priority (fix within ~1 week)

### H1 — Connection links must be real `<a href>`, not just the canvas
Your graph is a `react-force-graph-2d` **canvas** — crawlers and LLMs cannot follow canvas "edges." Your strongest asset (179 reasoned interconnections) only passes link equity and topical-relevance signals if each node page also renders connected nodes as real HTML anchors server-side.
- **Action:** Confirm `/node/[id]` SSR HTML contains `<a href="/node/...">` links to its connections (a "Related / Connected" list). If it's canvas-only, add a server-rendered link list.
- **How you'd know it failed:** `view-source` on a node shows no `/node/` anchors outside nav.
- **Leading indicator:** GSC "Links → Internal links" should show node-to-node links climbing past sitemap-only discovery.

### H2 — Authorship signal for E-E-A-T
`author` resolves to `Organization` only. Several topics are contested/YMYL-adjacent (consciousness claims, MKUltra, COVID lab leak, election fraud). Google's QRG rewards demonstrable, attributable expertise.
- **Action:** Add a named editorial `Person` (or git-derived contributors) as `author`, and an `Organization.sameAs` → GitHub. Your "editorial standards" page is a great foundation to attach a real byline to.
- **Falsifiability:** If nodes already earn AI citations without bylines, downgrade to Medium.
- **Leading indicator:** Perplexity/AI-Overview citation frequency; impressions on node-topic queries in GSC.

---

## 🟡 Medium Priority (within ~1 month)

### M1 — Phantom nodes are indexable thin pages → see **T1** (raised to High)
`industry-plants` and `satanic-panic` return `200` + `index, follow` with only "proposed topic — contribute" content. The technical deep-dive **confirmed this live** (`/node/satanic-panic` → `HTTP 200`, self-canonical, empty Article JSON-LD) and raised it to **High (T1)**. Just 2 today, but this grows with the graph.
- **Action:** Add `robots: { index: false, follow: true }` in `generateMetadata` for the phantom branch. Keeps them crawlable/contributable without index bloat.
- **Leading indicator:** GSC "Crawled – currently not indexed" / soft-404 count staying flat as the graph grows.

### M2 — Per-node OG / social images
Every node shares `/og.jpg`. You already ship `generate-og-layouts.mjs` — wire its output into each node's `openGraph.images` and the Article schema `image`.
- **Payoff:** Higher social CTR and a distinct visual per node for AI/social previews.

### M3 — Verify meta-description quality per node
Descriptions are auto-derived via `getNodeExcerpt()`. Risk: mid-sentence truncation or >160 chars.
- **Action:** Spot-check 5–10 nodes; consider an optional frontmatter `summary` field for hand-tuned descriptions on flagship nodes.

---

## 🟢 Low Priority (backlog)

- **L1** — `<meta name="keywords">` on homepage is ignored by Google; harmless, can drop.
- **L2** — Twitter card title for nodes omits "— Apeirron" (uses bare `frontmatter.title`); align with the OG/`<title>` for brand consistency.
- **L3** — Add `Organization.sameAs: ["https://github.com/theiskaa/apeirron"]` for entity disambiguation.

---

## 🔧 Technical SEO Deep-Dive (`/seo technical`, 2026-06-30)

Grounded in live HTTP probes + source inspection (`next.config.mjs`, `app/robots.ts`, `app/sitemap.ts`, `app/node/[id]/page.tsx`, `app/not-found.tsx`). **Technical sub-score: 87/100.**

### 9-category scorecard

| # | Category | Verdict |
|---|---|---|
| 1 | Crawlability | ✅ Pass — AI bots allowed, sitemap clean, no accidental `Disallow` |
| 2 | Indexability | ⚠️ Phantom nodes indexable (404s & canonicals otherwise correct) |
| 3 | Security | ⚠️ Baseline strong; **CSP missing** |
| 4 | URL structure | ✅ Pass — trailing slash `308`→clean, apex→www, HSTS preload |
| 5 | Mobile | ✅ Pass — correct viewport, no `user-scalable` traps |
| 6 | Core Web Vitals | ⚠️ Source-level INP/LCP risk (force-graph) — needs field data |
| 7 | Structured data | ✅ Pass — full coverage; phantom + OG gaps minor |
| 8 | JS rendering | ✅ Pass — content SSR'd, `x-nextjs-prerender: 1` confirmed |
| 9 | IndexNow | ❌ Not implemented |

### High

- **T1 — Phantom nodes indexable** (confirmed live). `/node/satanic-panic` → `HTTP 200`, self-canonical, zero prose, empty-description Article JSON-LD. (`/node/industry-plants` timed out on probe — uncached, verify manually.) → Add `robots: { index: false, follow: true }` to the phantom branch of `generateMetadata` in `app/node/[id]/page.tsx`. *(Same as M1 above.)*
- **T2 — No Content-Security-Policy header.** All other security headers present (incl. Permissions-Policy). `dangerouslySetInnerHTML` used in 2 spots (theme script + JSON-LD). → Add CSP in `next.config.mjs` `headers()`; deploy as `Content-Security-Policy-Report-Only` w/ `report-uri` first, then enforce. Policy must allow Google Fonts + inline JSON-LD.

### Medium

- **T3 — Query params cache-pollute.** `/node/consciousness?foo=bar` → `200` (new Cloudflare cache entry per param). Canonical protects rankings, not Worker/cache cost. → Cloudflare Transform Rule stripping query params on `/node/*`, or a `redirects()` rule.
- **T4 — IndexNow not implemented.** No key file, no `x-indexnow`. Bing/Yandex lag after deploys. → **Zero-code fix:** enable Cloudflare native IndexNow (Dashboard → Speed → Optimization → IndexNow).
- **T5 — INP risk from `react-force-graph-2d`.** Synchronous init over 179 nodes. → Lazy-load via `next/dynamic` (`ssr: false`) + `requestIdleCallback`. Confirm against CrUX before investing.
- **T6 — COOP/CORP headers absent.** Minor hardening for the canvas context. → add `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Resource-Policy: same-origin` in `next.config.mjs` (skip COEP — would break Google Fonts).

### Low

- **T7** — Set `export const dynamicParams = false` in `app/node/[id]/page.tsx` so unknown `/node/*` 404s instantly instead of burning Worker SSR. (Safe — `generateStaticParams` is exhaustive.)
- **T8** — Drop `X-Powered-By` via `poweredByHeader: false` in `next.config.mjs`.
- **T9** — `interest-cohort=()` in Permissions-Policy is a dead FLoC directive; replace with `browsing-topics=()` or remove.
- **T10** — Per-node OG images (you already have `generate-og-layouts.mjs`) — also strengthens Article rich-result eligibility. *(Same as M2.)*

**Confirmed passing (don't touch):** real-URL 404s (`/node/<missing>` and bare `/node` both return `HTTP 404`, no soft-404), trailing-slash `308`→clean, HSTS preload, SSR content, prerendered routes.

---

## 📊 Not yet measured — recommended next step

Core Web Vitals **field data** was not pulled. The 476 KB HTML per node (full graph metadata inline + force-graph hydration) is a plausible **INP/TBT risk on mobile** (see T5), but only real-user data confirms it.

→ Run **`/seo google`** (PageSpeed + CrUX) for field INP/LCP/CLS.

**Falsifiability for the perf concern:** PSI mobile INP p75 < 200 ms and LCP < 2.5 s → no action needed; ignore the perf flag.

---

## Suggested sequence

1. **T1/M1** noindex phantoms + **T7** `dynamicParams=false` — ship together, 4 lines in `page.tsx`
2. **T4** Cloudflare IndexNow — dashboard toggle, zero code
3. **H1** (verify/add anchor links) — biggest ranking lever, low effort
4. **T2** CSP in report-only mode
5. **T3 / T6 / T8 / T9** — batch into one `next.config.mjs` headers pass
6. **H2** (authorship) — compounding E-E-A-T/GEO benefit
7. **M2/T10** (per-node OG) — you already have the tooling
8. Pull CrUX field data (`/seo google`) before touching **T5** perf work
