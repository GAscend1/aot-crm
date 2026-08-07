import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Query provider audit - guards the "single QueryClient + QueryCacheBridge
 * always inside QueryClientProvider" invariant.
 *
 * This is a static contract check in the same style as rbac-audit.test.ts.
 * It makes it impossible to:
 *   1. introduce a second QueryClient / QueryClientProvider, or
 *   2. render QueryCacheBridge (which calls useQueryClient) outside the
 *      provider tree, which would regress the "No QueryClient set" runtime
 *      failure seen when a stale providers module was compiled without the
 *      QueryClientProvider while AppProviders already referenced the bridge.
 */

const SRC_ROOTS = ["app", "components", "hooks", "modules", "providers"];

const TS_EXTENSIONS = new Set([".ts", ".tsx"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (TS_EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) {
      out.push(full);
    }
  }
  return out;
}

const sourceFiles = SRC_ROOTS.flatMap((root) => {
  const abs = join(process.cwd(), root);
  try {
    return walk(abs);
  } catch {
    return [];
  }
});

/** Path relative to project root with forward slashes, for readable failures. */
function relPath(file: string): string {
  const root = process.cwd().replace(/\\/g, "/");
  return file.replace(/\\/g, "/").replace(`${root}/`, "");
}

describe("Query provider audit: single QueryClient + bridge placement", () => {
  it("finds source files to audit", () => {
    expect(sourceFiles.length).toBeGreaterThan(100);
  });

  it("creates exactly one QueryClient and one QueryClientProvider", () => {
    const offenders: string[] = [];
    let clientCount = 0;
    let providerCount = 0;

    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf-8");
      const clients = (source.match(/new QueryClient\(/g) ?? []).length;
      const providers = (source.match(/<QueryClientProvider/g) ?? []).length;
      if (clients > 0) clientCount += clients;
      if (providers > 0) providerCount += providers;
      if (clients > 1 || (clients > 0 && providers === 0)) {
        offenders.push(`${relPath(file)} creates a QueryClient without rendering QueryClientProvider`);
      }
    }

    expect(clientCount).toBe(1);
    expect(providerCount).toBe(1);
    expect(offenders).toEqual([]);
  });

  it("QueryCacheBridge is only rendered inside the QueryClientProvider tree", () => {
    // QueryCacheBridge calls useQueryClient(), so any file that renders it
    // must be a descendant of providers/index.tsx (the single provider root).
    const bridgeRenderers: string[] = [];
    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf-8");
      if (!source.includes("QueryCacheBridge")) continue;
      if (file.endsWith("QueryCacheBridge.tsx")) continue; // definition
      bridgeRenderers.push(relPath(file));
    }

    // The bridge may only be mounted by the root Providers component — which
    // is itself wrapped in QueryClientProvider. Any other renderer regresses
    // the "No QueryClient set" runtime failure.
    expect(bridgeRenderers).toEqual(["providers/index.tsx"]);
  });

  it("root layout mounts Providers so every route gets a QueryClient", () => {
    const rootLayout = readFileSync(join(process.cwd(), "app", "layout.tsx"), "utf-8");
    expect(rootLayout).toContain('import Providers from "@/providers"');
    expect(rootLayout).toContain("<Providers>");
  });

  it("providers/index.tsx renders the bridge inside the provider boundary", () => {
    const providers = readFileSync(join(process.cwd(), "providers", "index.tsx"), "utf-8");
    const open = providers.indexOf("<QueryClientProvider");
    const close = providers.indexOf("</QueryClientProvider>");
    expect(open).toBeGreaterThanOrEqual(0);
    expect(close).toBeGreaterThan(open);
    const between = providers.slice(open, close);
    expect(between).toContain("<QueryCacheBridge");
  });
});
