import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Loads Cloudflare bindings (env vars, KV, etc.) into `next dev` via .dev.vars.
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // NOTE: apex (apeirron.com) → www (www.apeirron.com) redirect is handled by
  // a Cloudflare Redirect Rule at the edge, not here. @opennextjs/cloudflare
  // does not fully interpret Next.js's path-to-regexp placeholders or `has`
  // predicate — both would leak through as literal strings at runtime.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Cross-origin isolation hardening for the canvas/force-graph context.
          // COEP is intentionally omitted — it would break next/font and other
          // cross-origin loads for no benefit here.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          // CSP shipped in Report-Only first — violations log to the console
          // without blocking, so a missed surface can't break the site. Flip
          // the key to `Content-Security-Policy` to enforce once validated.
          //
          // `script-src 'unsafe-inline'` is required: the static export emits
          // per-page RSC bootstrap scripts (`self.__next_f.push(...)`) inline,
          // which can't carry a build-stable hash, and a nonce would force
          // pages off static generation. JSON-LD blocks are exempt from
          // script-src. Fonts are self-hosted by next/font (no Google Fonts
          // domains). All subresources and client fetches are same-origin.
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
