import { afterEach, describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  isAotPlatformTenantConfigured,
  isAotPlatformTenantId,
} from "@/lib/server/platform-tenant";

// ---------------------------------------------------------------------------
// Rule: authenticated Entra tid === AOT_PLATFORM_TENANT_ID → Platform Owner.
// A customer tenant's admin (different tid) is NEVER a Platform Owner.
// ---------------------------------------------------------------------------

const ORIGINAL = process.env.AOT_PLATFORM_TENANT_ID;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AOT_PLATFORM_TENANT_ID;
  else process.env.AOT_PLATFORM_TENANT_ID = ORIGINAL;
});

describe("tenant-based Platform Owner detection (lib/server/platform-tenant)", () => {
  it("returns true for the exact AOT tenant id (case-insensitive)", () => {
    process.env.AOT_PLATFORM_TENANT_ID = "aaaa-bbbb-cccc";
    expect(isAotPlatformTenantId("aaaa-bbbb-cccc")).toBe(true);
    expect(isAotPlatformTenantId("AAAA-BBBB-CCCC")).toBe(true);
  });

  it("returns false for a customer tenant's tid — even a tenant admin", () => {
    process.env.AOT_PLATFORM_TENANT_ID = "aaaa-bbbb-cccc";
    expect(isAotPlatformTenantId("customer-tenant-guid-1111")).toBe(false);
    expect(isAotPlatformTenantId("customer-tenant-guid-2222")).toBe(false);
  });

  it("returns false when no verified tid is available", () => {
    process.env.AOT_PLATFORM_TENANT_ID = "aaaa-bbbb-cccc";
    expect(isAotPlatformTenantId(null)).toBe(false);
    expect(isAotPlatformTenantId(undefined)).toBe(false);
    expect(isAotPlatformTenantId("")).toBe(false);
  });

  it("is never owner when AOT_PLATFORM_TENANT_ID is not configured", () => {
    delete process.env.AOT_PLATFORM_TENANT_ID;
    expect(isAotPlatformTenantId("aaaa-bbbb-cccc")).toBe(false);
    expect(isAotPlatformTenantConfigured()).toBe(false);
  });

  it("ignores surrounding whitespace in the configured value", () => {
    process.env.AOT_PLATFORM_TENANT_ID = "  aaaa-bbbb-cccc  ";
    expect(isAotPlatformTenantId("aaaa-bbbb-cccc")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Static guards — the platform surface must use the centralized server-side
// guard and the admin page must not role-gate Platform Owners.
// ---------------------------------------------------------------------------

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...walk(full));
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) results.push(full);
  }
  return results;
}

const read = (p: string) => readFileSync(p, "utf8");

describe("Platform Owner route hardening (static)", () => {
  it("every /api/platform/* route uses the centralized requirePlatformOwner guard", () => {
    const platformRoutes = walk(join(process.cwd(), "app", "api", "platform"));
    expect(platformRoutes.length).toBeGreaterThan(0);
    for (const route of platformRoutes) {
      const src = read(route);
      expect(
        src,
        `${route} must call requirePlatformOwner() (never the old email-based check)`,
      ).toContain("requirePlatformOwner()");
      // No stray legacy email/role-only owner check in the guard position.
      expect(src).not.toContain("isPlatformOwner(user)");
    }
  });

  it("administration page is PLATFORM OWNER ONLY (redirects non-owners)", () => {
    const src = read(
      join(process.cwd(), "app", "(app)", "administration", "page.tsx"),
    );
    // Ownership decided by the verified Entra tid — never the workspace role.
    expect(src).toContain("isPlatformOwner(user, tenantId)");
    // Non-owners are redirected — no role-gated "Access restricted" state,
    // no in-workspace ADMIN bypass.
    expect(src).toContain('redirect("/dashboard")');
    expect(src).not.toContain("isAdmin");
    expect(src).not.toContain("Access restricted");
  });

  it("navigation hides the Administration item for non-owners (ownerOnly flag)", () => {
    const src = read(join(process.cwd(), "config", "navigation.ts"));
    expect(src).toContain("ownerOnly?: boolean");
    expect(src).toContain('ownerOnly: true');
    expect(src).toContain("navigationForUser");
    expect(src).toContain("!item.ownerOnly || owner");
  });

  it("AppSidebar receives isPlatformOwner from the server layout and filters nav", () => {
    const layout = read(join(process.cwd(), "app", "(app)", "layout.tsx"));
    expect(layout).toContain("isPlatformOwner = session?.user?.isPlatformOwner === true");
    expect(layout).toContain("<AppSidebar isPlatformOwner={isPlatformOwner} />");

    const sidebar = read(join(process.cwd(), "components", "layout", "AppSidebar.tsx"));
    expect(sidebar).toContain("navigationForUser(isPlatformOwner)");
  });

  it("command palette hides the Administration command for non-owners", () => {
    const src = read(join(process.cwd(), "components", "enterprise", "CommandPalette.tsx"));
    expect(src).toContain("cmd.id !== \"settings\"");
    expect(src).toContain("session?.user?.isPlatformOwner === true");
  });

  it("the Microsoft integration status page is owner-gated via a server wrapper", () => {
    const src = read(
      join(process.cwd(), "app", "(app)", "administration", "microsoft-integration", "page.tsx"),
    );
    expect(src).toContain("isPlatformOwner(user, tenantId)");
    expect(src).toContain('redirect("/dashboard")');
    expect(src).toContain("<MicrosoftIntegrationClient />");
  });

  it("session surface exposes the display-only isPlatformOwner flag", () => {
    const src = read(join(process.cwd(), "auth.ts"));
    expect(src).toContain("isPlatformOwner?: boolean");
    expect(src).toContain("isAotPlatformTenantId");
  });

  it("featureGate bypasses the plan matrix for verified Platform Owners", () => {
    const src = read(join(process.cwd(), "lib", "server", "api.ts"));
    expect(src).toContain(
      "isPlatformOwner(user, session?.user?.tenantId ?? null)",
    );
    // The bypass must NOT touch the customer's Subscription row.
    expect(src).not.toMatch(/grantPlan\(.*\n.*featureGate/s);
  });

  it("with-graph-auth entitlement checks bypass for Platform Owners", () => {
    const src = read(
      join(
        process.cwd(),
        "app",
        "api",
        "integrations",
        "microsoft",
        "with-graph-auth.ts",
      ),
    );
    expect(src).toContain("ownerBypass");
    expect(src).toContain("isPlatformOwner(user, session.user.tenantId");
  });

  it("the subscription API reports full canUse for Platform Owners (never plan-locked)", () => {
    const src = read(
      join(process.cwd(), "app", "api", "billing", "subscription", "route.ts"),
    );
    // The client entitlement payload is evaluated against ENTERPRISE for a
    // verified owner — WITHOUT mutating the organization's Subscription row.
    expect(src).toContain('const effectivePlan = platformOwner ? "ENTERPRISE"');
    expect(src).toContain("canUseFeature(effectivePlan, feature)");
  });
});
