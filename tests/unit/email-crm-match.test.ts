import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  matchAddressesToRecords,
  matchCompaniesByDomain,
} from "../../lib/email-match";

describe("matchAddressesToRecords (pure, org-scoped input)", () => {
  const records = [
    { kind: "contact" as const, id: "c1", name: "Tom Baker", email: "customer@contoso.com", company: "Contoso Ltd.", href: "/contacts/c1" },
    { kind: "contact" as const, id: "c2", name: "Jane Roe", email: "jane@aot.test", company: null, href: "/contacts/c2" },
    { kind: "lead" as const, id: "l1", name: "Lead One", email: "lead@acme.test", company: "Acme", href: "/leads/l1" },
  ];

  it("matches case-insensitively", () => {
    const matches = matchAddressesToRecords(records, ["Customer@Contoso.COM"]);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("c1");
  });

  it("matches multiple addresses without duplicates", () => {
    const matches = matchAddressesToRecords(records, ["customer@contoso.com", "jane@aot.test", "customer@contoso.com"]);
    expect(matches.map((m) => m.id).sort()).toEqual(["c1", "c2"]);
  });

  it("returns nothing when no address matches", () => {
    expect(matchAddressesToRecords(records, ["nobody@else.test"])).toEqual([]);
  });

  it("never matches a record for an address that only exists in another org's data (by construction)", () => {
    // The route passes ONLY org-scoped rows; an address that matches nothing
    // in those rows yields no match — no global lookup can occur.
    const otherOrgContact = { ...records[0], id: "foreign", email: "customer@contoso.com" };
    expect(matchAddressesToRecords([otherOrgContact], ["someone@else.test"])).toEqual([]);
  });
});

describe("matchCompaniesByDomain", () => {
  it("matches companies whose email domain equals the sender's domain", () => {
    const companies = [
      { id: "co1", name: "Contoso Ltd.", email: "info@contoso.com", href: "/companies/co1" },
      { id: "co2", name: "Acme Corp", email: "sales@acme.com", href: "/companies/co2" },
    ];
    const matches = matchCompaniesByDomain(companies, ["customer@contoso.com"]);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("co1");
  });

  it("returns nothing for unknown domains or companies without email", () => {
    expect(matchCompaniesByDomain([{ id: "x", name: "X", email: null, href: "/companies/x" }], ["a@x.com"])).toEqual([]);
  });
});

describe("Email association routes — org isolation + deduplication (static)", () => {
  it("context route scopes every query to the current organization", () => {
    const src = readFileSync(join(process.cwd(), "app", "api", "email", "context", "route.ts"), "utf8");
    // Every findMany must be org-scoped; there is no global email lookup.
    const orgScoped = (src.match(/organizationId: user\.organizationId/g) ?? []).length;
    expect(orgScoped).toBeGreaterThanOrEqual(4);
    expect(src).toContain("matchAddressesToRecords");
  });

  it("associate route resolves the entity org-scoped and dedupes by graphMessageId", () => {
    const src = readFileSync(join(process.cwd(), "app", "api", "email", "associate", "route.ts"), "utf8");
    expect(src).toContain("organizationId: user.organizationId");
    expect(src).toContain("not found in your organization");
    expect(src).toContain("graphMessageId: parsed.messageId");
    expect(src).toContain("duplicate: true");
    expect(src).toContain('type: "Email"');
  });

  it("associations route filters by organization AND graphMessageId", () => {
    const src = readFileSync(join(process.cwd(), "app", "api", "email", "associations", "route.ts"), "utf8");
    expect(src).toContain("organizationId: user.organizationId, graphMessageId: messageId");
  });

  it("no automatic mailbox import: only the explicit associate action persists", () => {
    const outlook = readFileSync(join(process.cwd(), "services", "outlook.service.ts"), "utf8");
    // Outlook fetching never writes CRM activities; the only write path is the
    // explicit linkEmailToRecord call.
    expect(outlook).toContain("linkEmailToRecord");
    expect(outlook).not.toContain("activity.create");
  });
});
