import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) =>
  readFileSync(join(process.cwd(), ...p.split("/")), "utf8");

const WORKSPACE = read("app/(app)/opportunities/components/OpportunityWorkspace.tsx");
const HEADER = read("app/(app)/opportunities/components/OpportunityWorkspaceHeader.tsx");
const MEETINGS = read("app/(app)/activities/views/MeetingsView.tsx");
const OPP_PAGE = read("app/(app)/opportunities/[id]/page.tsx");
const CUSTOMER_DETAIL = read("app/(app)/customers/[id]/CustomerDetailClient.tsx");
const CUSTOMER_WORKSPACE = read("app/(app)/customers/components/CustomerWorkspace.tsx");
const COMPANY_WORKSPACE = read("app/(app)/companies/components/CompanyWorkspace.tsx");
const CONTACT_WORKSPACE = read("app/(app)/contacts/components/ContactWorkspace.tsx");
const ZOOM_API = read("app/api/integrations/zoom/meetings/route.ts");
const TICKETS_ROUTE = read("app/api/tickets/route.ts");
const TICKETS_ID_ROUTE = read("app/api/tickets/[id]/route.ts");
const TICKETS_PAGE = read("app/(app)/tickets/page.tsx");
const TICKETS_GATE = read("app/(app)/tickets/components/TicketsModuleGate.tsx");
const TICKETS_DETAIL = read("app/(app)/tickets/[id]/page.tsx");
const QUOTES_DETAIL = read("app/(app)/quotes/[id]/page.tsx");
const INVOICES_DETAIL = read("app/(app)/invoices/[id]/page.tsx");

/**
 * Final matrix quick-action gating:
 * - Starter: no usable Teams / Zoom / Email / Quote / Invoice actions.
 * - Professional: no usable Teams / Zoom / Calendar Sync actions (Email stays).
 * - Trial & Enterprise: actions shown per provider connection state.
 * Gates use the centralized useCanUse / FeatureGate — never plan-string checks.
 */
describe("quick-action gating uses centralized entitlements (static)", () => {
  it("OpportunityWorkspace gates Teams/Zoom/Email actions via useCanUse", () => {
    expect(WORKSPACE).toContain('useCanUse("teams")');
    expect(WORKSPACE).toContain('useCanUse("zoom")');
    expect(WORKSPACE).toContain('useCanUse("outlook_email")');
    expect(WORKSPACE).toContain("...(canTeams");
    expect(WORKSPACE).toContain("...(canZoom");
  });

  it("OpportunityWorkspaceHeader hides Teams/Zoom/Email buttons when locked", () => {
    expect(HEADER).toContain("canTeams && (");
    expect(HEADER).toContain("canZoom && (");
    expect(HEADER).toContain("canEmail && (");
  });

  it("opportunity detail page gates Teams/Zoom/Email actions", () => {
    expect(OPP_PAGE).toContain("canTeams && (");
    expect(OPP_PAGE).toContain("canZoom && (");
    expect(OPP_PAGE).toContain("canEmail && (");
  });

  it("customer detail client gates Teams/Zoom/Email actions", () => {
    expect(CUSTOMER_DETAIL).toContain("useCanUse(\"outlook_email\")");
    expect(CUSTOMER_DETAIL).toContain("canTeams && (");
    expect(CUSTOMER_DETAIL).toContain("canZoom && (");
  });

  it("MeetingsView gates BOTH Teams and Zoom buttons with FeatureGate", () => {
    expect(MEETINGS).toContain('<FeatureGate feature="teams"');
    expect(MEETINGS).toContain('<FeatureGate feature="zoom"');
    expect(MEETINGS).toContain('mode="hide"');
  });

  it("record workspaces hide the Email action when outlook_email is locked", () => {
    expect(CUSTOMER_WORKSPACE).toContain('useCanUse("outlook_email")');
    expect(CUSTOMER_WORKSPACE).toContain("...(canEmail");
    expect(COMPANY_WORKSPACE).toContain('useCanUse("outlook_email")');
    expect(COMPANY_WORKSPACE).toContain("...(canEmail");
    expect(CONTACT_WORKSPACE).toContain('useCanUse("outlook_email")');
    expect(CONTACT_WORKSPACE).toContain("...(canEmail");
  });

  it("tickets API enforces the entitlement on GET and every write handler", () => {
    // Both featureGate (plan) and subscriptionWriteGate (active) on writes.
    const postGates = TICKETS_ROUTE.match(/featureGate\(user, "tickets"\)/g) ?? [];
    expect(postGates.length).toBeGreaterThanOrEqual(2); // GET + POST
    expect(TICKETS_ROUTE).toContain("const subGate = await subscriptionWriteGate(user);");
    const idGates = TICKETS_ID_ROUTE.match(/featureGate\(user, "tickets"\)/g) ?? [];
    expect(idGates.length).toBe(3); // GET + PATCH + DELETE
    expect(TICKETS_ID_ROUTE).toContain("const subGate = await subscriptionWriteGate(user);");
  });

  it("tickets module page is gated for plans without tickets", () => {
    expect(TICKETS_PAGE).toContain("<TicketsModuleGate>");
    expect(TICKETS_GATE).toContain('feature="tickets"');
    expect(TICKETS_GATE).toContain('mode="replace"');
  });

  it("deep-linked detail pages show a polished FeatureGate locked state (no raw 403)", () => {
    // Every plan-gated detail page reuses the shared FeatureGate for its locked
    // state instead of surfacing a raw fetch error or redirecting to a 403.
    // Authorization is unchanged — the APIs still return 403.
    expect(TICKETS_DETAIL).toContain('<FeatureGate feature="tickets" featureLabel="Tickets" mode="replace">');
    expect(QUOTES_DETAIL).toContain('<FeatureGate feature="quotes" featureLabel="Quotes" mode="replace">');
    expect(QUOTES_DETAIL).toContain('useCanUse("quotes")');
    expect(QUOTES_DETAIL).toContain("if (!canUseQuotes) return;");
    expect(INVOICES_DETAIL).toContain('<FeatureGate feature="invoices" featureLabel="Invoices" mode="replace">');
    expect(INVOICES_DETAIL).toContain('useCanUse("invoices")');
    expect(INVOICES_DETAIL).toContain("if (!canUseInvoices) return;");
  });

  it("no component hardcodes plan === 'STARTER' string checks", () => {
    // The centralized system (canUse / FeatureGate) must be the only gate.
    expect(WORKSPACE).not.toMatch(/plan\s*===\s*["']STARTER["']/);
    expect(HEADER).not.toMatch(/plan\s*===\s*["']STARTER["']/);
    expect(MEETINGS).not.toMatch(/plan\s*===\s*["']STARTER["']/);
  });

  it("Zoom stays honestly NOT CONFIGURED server-side (never faked)", () => {
    expect(ZOOM_API).toContain("503");
    expect(ZOOM_API).toContain("not enabled");
  });
});
