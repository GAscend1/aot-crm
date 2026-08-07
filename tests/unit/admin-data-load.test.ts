import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) =>
  readFileSync(join(process.cwd(), ...p.split("/")), "utf8");

const USERS_ROUTE = read("app/api/admin/users/route.ts");
const USERS_ID_ROUTE = read("app/api/admin/users/[id]/route.ts");
const API_LIB = read("lib/server/api.ts");
const ADMIN_PAGE = read("app/(app)/administration/page.tsx");

/**
 * LIVE bug: the standard user-management table on the Administration page
 * showed "Failed to load data" while the Platform Owner Organizations section
 * below loaded fine.
 *
 * Root cause: GET /api/admin/users returned 403 for the Platform Owner because
 * their CRM workspace role is VIEWER (not SUPER_ADMIN/ADMIN) and the route only
 * checked the workspace role — the Platform Owner bypass was never applied to
 * the API, so useApiList surfaced "Failed to load data".
 *
 * Fix: the admin user routes now accept in-workspace admins OR verified AOT
 * Platform Owners (isAdminOrPlatformOwner). The table is NOT removed and zero
 * users are never faked — the real data now loads.
 */
describe("Administration user table data load (Platform Owner bypass)", () => {
  it("GET /api/admin/users accepts Platform Owners, not only the ADMIN role", () => {
    expect(USERS_ROUTE).toContain("isAdminOrPlatformOwner");
    expect(USERS_ROUTE).not.toContain("if (!isAdmin(user)) return forbidden();");
  });

  it("POST /api/admin/users uses the same owner-aware guard", () => {
    expect(USERS_ROUTE).toContain("await isAdminOrPlatformOwner(user)");
  });

  it("per-user admin routes ([id] GET/PATCH/DELETE) use the owner-aware guard", () => {
    expect(USERS_ID_ROUTE).toContain("isAdminOrPlatformOwner");
    expect(USERS_ID_ROUTE).not.toContain("if (!isAdmin(user)) return forbidden();");
  });

  it("lib/server/api.ts exports the shared isAdminOrPlatformOwner helper", () => {
    expect(API_LIB).toContain("export async function isAdminOrPlatformOwner");
  });

  it("the administration page still renders the user table for owners", () => {
    expect(ADMIN_PAGE).toContain("<AdminTable />");
    expect(ADMIN_PAGE).toContain("isPlatformOwner(user, tenantId)");
    // The page is Platform Owner ONLY — the user table exists under the owner
    // surface, and in-workspace admins are no longer admitted to Administration.
    expect(ADMIN_PAGE).toContain('redirect("/dashboard")');
  });
});
