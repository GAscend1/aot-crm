import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * RBAC audit - guards the every-API-route-authenticates invariant.
 *
 * Scans app/api route.ts files and asserts that every exported route handler
 * references an authentication guard (getCrmUser, requireUser, or the
 * auth()/session helper) before touching data. Routes that are explicitly
 * public (webhooks, auth callbacks) are allowlisted.
 *
 * This is a static contract check - it does not replace runtime tests, but it
 * makes it impossible to add a new unauthenticated route by accident.
 */

const API_ROOT = join(process.cwd(), "app", "api");

/** Routes that are intentionally reachable without a CRM session. */
const ALLOWLIST: string[] = [
  // Auth.js catch-all - NextAuth handles its own protection.
  "auth/[...nextauth]",
  // Microsoft Graph webhook receiver - validated by clientState + validationToken.
  "integrations/microsoft/calendar/webhook",
  // Microsoft 365 status probe - reads the JWT via getToken() itself and
  // returns only a state enum (no CRM data); must answer for signed-out
  // visitors so the UI can render sign-in CTAs.
  "integrations/microsoft/status",
  // Zoom stub - returns a static 503 for every method; no data is exposed.
  "integrations/zoom/meetings",
  // Background sync worker - intentionally session-less cron endpoint; it
  // processes only users with an active delta cursor and is guarded by the
  // CRON_SECRET header check when configured.
  "calendar/sync/background",
  // Public Request Demo / Contact Sales form - intentional anonymous submission;
  // rate-limited by IP and validated server-side (never auto-creates records).
  "sales-inquiries",
];

const GUARD_MARKERS = [
  "getCrmUser(",
  "requireUser(",
  "requirePlatformOwner(",
  "getCrmUserAsync",
  "const session = await auth()",
  "session?.user",
  "req.auth",
];

function listRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listRouteFiles(full));
    } else if (entry === "route.ts") {
      out.push(full);
    }
  }
  return out;
}

const routeFiles = listRouteFiles(API_ROOT);

/** Relative API path (e.g. "opportunities/[id]") for readable failures. */
function relPath(file: string): string {
  return file
    .replace(/\\/g, "/")
    .replace(/^.*\/app\/api\//, "")
    .replace(/\/route\.ts$/, "");
}

describe("RBAC audit: every API route authenticates", () => {
  it("finds route files to audit", () => {
    expect(routeFiles.length).toBeGreaterThan(50);
  });

  it("every non-allowlisted route file guards the caller", () => {
    const offenders: string[] = [];
    for (const file of routeFiles) {
      const rel = relPath(file);
      if (ALLOWLIST.includes(rel)) continue;
      const source = readFileSync(file, "utf-8");

      const hasHandler = /export (?:async )?function (GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)/.test(source);
      if (!hasHandler) continue;

      const hasGuard = GUARD_MARKERS.some((m) => source.includes(m));
      if (!hasGuard) {
        offenders.push(
          `${rel} exports route handlers but never authenticates the caller — add getCrmUser() + unauthorized() guard`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });

  it("admin routes require an admin (or Platform Owner) guard", () => {
    // In-workspace admins are enforced via isAdmin() OR the owner-aware
    // isAdminOrPlatformOwner() (verified AOT Platform Owners may administer
    // users even when their workspace role is not ADMIN). Both are valid.
    const adminFiles = routeFiles.filter((f) => f.includes("admin"));
    expect(adminFiles.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const file of adminFiles) {
      const source = readFileSync(file, "utf-8");
      if (
        !source.includes("isAdmin(") &&
        !source.includes("isAdminOrPlatformOwner") &&
        !source.includes("requireAdmin")
      ) {
        offenders.push(
          `${relPath(file)} is an admin route but does not enforce isAdmin()/isAdminOrPlatformOwner()`
        );
      }
    }
    expect(offenders).toEqual([]);
  });
});
