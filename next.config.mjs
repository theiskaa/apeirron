import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Loads Cloudflare bindings (env vars, KV, etc.) into `next dev` via .dev.vars.
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
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
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
