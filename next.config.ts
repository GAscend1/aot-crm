import type { NextConfig } from "next";

/**
 * Next.js 16 builds with Turbopack by default, so webpack hooks are out.
 * The Lighthouse bundle budget is enforced by `scripts/check-bundle-budget.mjs`
 * after `next build` (see package.json): it fails the build when any emitted
 * JS chunk exceeds the budget.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
};

export default nextConfig;