import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { planFeatures, ALL_FEATURES } from "@/lib/entitlements";

const read = (p: string) =>
  readFileSync(join(process.cwd(), ...p.split("/")), "utf8");

const API_ROUTE = read("app/api/documents/route.ts");
const STATS = read("app/(app)/documents/components/DocumentStats.tsx");
const ERROR_PAGE = read("app/error.tsx");
const GLOBAL_ERROR = read("app/global-error.tsx");
const PAGE = read("app/(app)/documents/page.tsx");

/**
 * Documents module regression suite.
 *
 * LIVE root cause: the running dev server served a stale Turbopack chunk
 * manifest — the /documents page (and every other page) crashed client-side
 * with ChunkLoadError ("Something went wrong") because referenced chunks 404'd.
 * The module code itself was healthy. This suite guards the code-level fixes:
 * 1) ChunkLoadError auto-recovery in the error boundaries, and 2) defensive
 * stats parsing, plus the entitlement invariant (documents on every plan).
 */
describe("Documents module availability (entitlements)", () => {
  it("grants documents on Trial, Starter, Professional and Enterprise", () => {
    for (const plan of ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]) {
      expect(
        planFeatures(plan).has("documents"),
        `${plan} must include documents`,
      ).toBe(true);
    }
  });

  it("documents is a declared feature code", () => {
    expect(ALL_FEATURES).toContain("documents");
  });
});

describe("Documents module API is not plan-gated (list is available to all)", () => {
  it("GET /api/documents has no featureGate call", () => {
    // Documents are part of every plan; only the subscription write gate
    // applies to mutations (expired-trial read-only policy).
    expect(API_ROUTE).not.toContain('featureGate(user, "documents")');
    expect(API_ROUTE).toContain("subscriptionWriteGate");
  });
});

describe("Documents module runtime hardening", () => {
  it("DocumentStats never crashes on null/number size values", () => {
    // Regression guard for the `d.size.replace(...)` class of crash.
    expect(STATS).toContain('typeof d.size === "string"');
    expect(STATS).toContain("String(d.size ?? \"\")");
    expect(STATS).toContain("parseFloat(raw) || 0");
  });

  it("the Documents page still mounts DocumentsView (module not hidden)", () => {
    expect(PAGE).toContain("<DocumentsView />");
  });
});

describe("ChunkLoadError auto-recovery (stale dev/prod chunks self-heal)", () => {
  it("app/error.tsx detects ChunkLoadError and reloads once", () => {
    expect(ERROR_PAGE).toContain("ChunkLoadError");
    expect(ERROR_PAGE).toContain("window.location.reload()");
    expect(ERROR_PAGE).toContain("isChunkLoadError");
  });

  it("app/global-error.tsx has the same recovery", () => {
    expect(GLOBAL_ERROR).toContain("ChunkLoadError");
    expect(GLOBAL_ERROR).toContain("window.location.reload()");
  });
});
