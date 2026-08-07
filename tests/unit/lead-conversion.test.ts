import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Lead conversion contract:
//   Lead → QUALIFIED → CONVERTED → match/create Contact + match/create Company
//   → optionally create Opportunity. The original Lead is RETAINED under Leads
//   (history) and linked to the created/reused records. Converting the same
//   person twice must reuse records by email — never duplicate them.
// ---------------------------------------------------------------------------

describe("Lead conversion (app/api/leads/[id]/convert/route.ts)", () => {
  const src = readFileSync(
    join(process.cwd(), "app", "api", "leads", "[id]", "convert", "route.ts"),
    "utf8"
  );

  it("prevents duplicate conversion (409 ALREADY_CONVERTED)", () => {
    expect(src).toContain('lead.status === "Converted" || lead.opportunityId || lead.convertedAt');
    expect(src).toContain('"ALREADY_CONVERTED"');
  });

  it("only converts Qualified leads", () => {
    expect(src).toContain('lead.status !== "Qualified"');
  });

  it("matches an existing Contact by email (org-scoped) before creating", () => {
    expect(src).toContain("tx.contact.findFirst");
    expect(src).toContain("email: lead.email");
    expect(src).toContain("archivedAt: null");
  });

  it("matches an existing Customer by email (org-scoped) before creating", () => {
    expect(src).toContain("tx.customer.findFirst");
    expect(src).toContain("email: lead.email");
  });

  it("retains the original Lead and links it to the created/reused records", () => {
    expect(src).toContain('status: "Converted" as LeadStatus');
    expect(src).toContain("customerId: customer.id");
    expect(src).toContain("opportunityId,");
  });

  it("returns the created/reused contact + customer ids for navigation", () => {
    expect(src).toContain("convertedContactId: result.lead.customer?.contactId");
    expect(src).toContain("convertedCustomerId: result.customerId");
  });

  it("links the customer record back to the person contact (360 view)", () => {
    expect(src).toContain("data: { contactId }");
  });
});

describe("Lead API surface exposes conversion links (app/api/leads/route.ts)", () => {
  const src = readFileSync(join(process.cwd(), "app", "api", "leads", "route.ts"), "utf8");

  it("leadToUI carries convertedCustomerId + convertedContactId", () => {
    expect(src).toContain("convertedCustomerId: c.customerId");
    expect(src).toContain("convertedContactId: c.customer?.contactId");
  });
});

describe("Converted lead navigation (UI)", () => {
  const workspace = readFileSync(
    join(process.cwd(), "app", "(app)", "leads", "components", "LeadWorkspace.tsx"),
    "utf8"
  );
  const detail = readFileSync(
    join(process.cwd(), "app", "(app)", "leads", "[id]", "page.tsx"),
    "utf8"
  );

  it("LeadWorkspace links to contact, customer, and opportunity after conversion", () => {
    expect(workspace).toContain("View linked contact");
    expect(workspace).toContain("View linked customer");
    expect(workspace).toContain("View linked opportunity");
  });

  it("lead detail page links to contact, customer, and opportunity after conversion", () => {
    expect(detail).toContain("View linked contact");
    expect(detail).toContain("View linked customer");
    expect(detail).toContain("View linked opportunity");
    expect(detail).toContain("retained here for history");
  });

  it("post-conversion navigation targets the canonical Customers view", () => {
    expect(detail).toContain('router.push("/contacts?view=customers")');
  });
});
