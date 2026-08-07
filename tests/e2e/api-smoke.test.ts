import { describe, it, expect } from "vitest";

/**
 * API smoke / E2E suite.
 *
 * Runs against a LIVE server (default http://localhost:3000, override with
 * E2E_BASE_URL). Verifies the deployment answers on the wire: auth guards,
 * public marketing routes, and health checks. The whole suite skips when no
 * server is reachable so it is safe in CI without a running app.
 *
 * Run with: `npm run test:e2e`
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

async function isUp(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/login`, { signal: AbortSignal.timeout(3000) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

const serverUp = await isUp();
if (!serverUp) {
  console.warn(`[e2e] No server at ${BASE_URL} — skipping API smoke suite.`);
}

describe.skipIf(!serverUp)("API smoke (live server)", () => {
  it("rejects unauthenticated requests to CRM module APIs with 401", async () => {
    const routes = [
      "/api/companies",
      "/api/contacts",
      "/api/opportunities",
      "/api/customers",
      "/api/leads",
      "/api/tickets",
      "/api/quotes",
      "/api/invoices",
      "/api/activities",
      "/api/documents",
      "/api/notifications",
      "/api/dashboard",
      "/api/reports",
      "/api/users",
      "/api/users/me",
      "/api/onboarding",
    ];
    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`);
      expect(res.status, `${route} should be 401 when unauthenticated`).toBe(401);
    }
  });

  it("rejects unauthenticated record-detail mutations", async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities/abc-123`, { method: "PATCH" });
    expect(res.status).toBe(401);
  });

  it("serves the public marketing + login pages", async () => {
    for (const path of ["/", "/login", "/features", "/pricing", "/security"]) {
      const res = await fetch(`${BASE_URL}${path}`);
      expect([200, 302]).toContain(res.status);
    }
  });

  it("redirects unauthenticated app routes instead of 500ing", async () => {
    // Unauthenticated app routes redirect to /login (302) rather than 500.
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    expect([302, 307, 200]).toContain(res.status);
  });
});
