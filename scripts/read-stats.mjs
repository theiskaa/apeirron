#!/usr/bin/env node
/**
 * Per-node engagement report from Cloudflare Analytics Engine.
 *
 * Analytics Engine has no dashboard UI — you query it via the SQL API.
 *
 * One-time setup:
 *   1. Cloudflare dashboard → Manage Account → API Tokens → Create Token →
 *      Custom token with permission:  Account · Account Analytics · Read.
 *   2. Find your account ID (dashboard URL, or run `wrangler whoami`).
 *   3. export CF_ACCOUNT_ID=...  CF_API_TOKEN=...
 *
 * Usage:  node scripts/read-stats.mjs [days]      (days defaults to 30)
 */

// Auto-load a local .env (CF_ACCOUNT_ID, CF_API_TOKEN) if present. Node doesn't
// read .env on its own; this avoids needing `node --env-file=.env`.
try {
  process.loadEnvFile();
} catch {
  // No .env file — fall back to whatever is already in the environment.
}

// Prefer the current Cloudflare env-var names (CF_* are deprecated and make
// wrangler/next print a deprecation warning); fall back to CF_* for compat.
const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const days = Number(process.argv[2] || 30);

if (!accountId || !token) {
  console.error(
    "Missing CLOUDFLARE_ACCOUNT_ID and/or CLOUDFLARE_API_TOKEN. See the header of this file for setup."
  );
  process.exit(1);
}

const sql = `SELECT index1 AS node, blob1 AS event, sum(_sample_interval) AS count
FROM apeirron_reads
WHERE timestamp > NOW() - INTERVAL '${days}' DAY
GROUP BY node, event`;

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
  { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: sql }
);

if (!res.ok) {
  console.error(`HTTP ${res.status}:`, await res.text());
  process.exit(1);
}

const { data } = await res.json();

const byNode = new Map();
for (const row of data ?? []) {
  const n = byNode.get(row.node) ?? { view: 0, read: 0, listen: 0 };
  n[row.event] = Number(row.count) || 0;
  byNode.set(row.node, n);
}

const rows = [...byNode.entries()]
  .map(([node, c]) => ({
    node,
    ...c,
    readRate: c.view ? Math.round((c.read / c.view) * 100) : 0,
  }))
  .sort((a, b) => b.view - a.view);

if (rows.length === 0) {
  console.log(`No events recorded in the last ${days} days yet.`);
  process.exit(0);
}

console.log(`Per-node engagement, last ${days} days (${rows.length} nodes):\n`);
console.log("views  reads  listens  read%  node");
for (const r of rows) {
  console.log(
    String(r.view).padStart(5),
    String(r.read).padStart(6),
    String(r.listen).padStart(8),
    `${r.readRate}%`.padStart(6),
    ` ${r.node}`
  );
}
