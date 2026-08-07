#!/usr/bin/env node
/**
 * Dependency-free load test for AOT CRM.
 *
 * Fires a burst of concurrent requests at an endpoint and reports latency
 * percentiles (p50/p90/p95/p99), throughput, and error rate. Useful as a
 * quick smoke before release and as a rough capacity check.
 *
 * Usage:
 *   npm run load:test -- --url http://localhost:3000/api/dashboard --concurrency 20 --requests 200
 *   (Unauthenticated API routes will 401 — pass a session cookie header if you
 *   want to measure real handler cost, e.g. --header "Cookie: ...")
 */
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, "");
  args[key] = process.argv[i + 1];
}

const URL = args.url ?? "http://localhost:3000/login";
const CONCURRENCY = parseInt(args.concurrency ?? "20", 10);
const REQUESTS = parseInt(args.requests ?? "200", 10);
const HEADER = args.header ?? "";
const TIMEOUT_MS = 30_000;

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

const latencies = [];
let errors = 0;
let next = 0;

async function worker() {
  while (true) {
    const i = next++;
    if (i >= REQUESTS) return;
    const started = performance.now();
    try {
      const headers = { ...(HEADER ? { Cookie: HEADER } : {}) };
      const res = await fetch(URL, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.status >= 500) errors++;
    } catch {
      errors++;
    }
    latencies.push(performance.now() - started);
  }
}

console.log(`\nLoad test — ${URL}`);
console.log(`  ${REQUESTS} requests, concurrency ${CONCURRENCY}`);
console.log("=".repeat(60));

const start = performance.now();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
const totalMs = performance.now() - start;

const sorted = [...latencies].sort((a, b) => a - b);
const p50 = percentile(sorted, 50);
const p90 = percentile(sorted, 90);
const p95 = percentile(sorted, 95);
const p99 = percentile(sorted, 99);
const mean = latencies.reduce((a, b) => a + b, 0) / Math.max(1, latencies.length);
const rps = (REQUESTS / totalMs) * 1000;

console.log(`\n  Completed in ${totalMs.toFixed(0)} ms`);
console.log(`  Throughput:  ${rps.toFixed(1)} req/s`);
console.log(`  Errors:      ${errors} (${((errors / REQUESTS) * 100).toFixed(1)}%)`);
console.log(`  Mean:        ${mean.toFixed(1)} ms`);
console.log(`  p50:         ${p50.toFixed(1)} ms`);
console.log(`  p90:         ${p90.toFixed(1)} ms`);
console.log(`  p95:         ${p95.toFixed(1)} ms`);
console.log(`  p99:         ${p99.toFixed(1)} ms`);

if (errors / REQUESTS > 0.01) {
  console.log("\nLoad test FAILED — error rate above 1%.\n");
  process.exit(1);
}
console.log("\nLoad test passed (error rate ≤ 1%).\n");
