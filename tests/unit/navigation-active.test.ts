import { describe, it, expect } from "vitest";

import { canonicalModulePath, findActiveItemHref, navigation } from "@/config/navigation";

/**
 * Guards the sidebar active-state contract:
 * - exactly one item can ever be highlighted
 * - child views highlight their parent module only (longest-prefix-wins)
 * - merged module views (/opportunities?view=kanban, /activities?view=calendar)
 *   highlight their parent module
 * - group labels are never treated as active pages
 */
describe("findActiveItemHref", () => {
  it("returns null for an unknown path", () => {
    expect(findActiveItemHref("/definitely-not-a-route")).toBeNull();
    expect(findActiveItemHref("/")).toBeNull();
  });

  it("matches exact module routes", () => {
    expect(findActiveItemHref("/dashboard")).toBe("/dashboard");
    expect(findActiveItemHref("/companies")).toBe("/companies");
    expect(findActiveItemHref("/contacts")).toBe("/contacts");
    expect(findActiveItemHref("/opportunities")).toBe("/opportunities");
    expect(findActiveItemHref("/quotes")).toBe("/quotes");
    expect(findActiveItemHref("/invoices")).toBe("/invoices");
    expect(findActiveItemHref("/activities")).toBe("/activities");
    expect(findActiveItemHref("/tickets")).toBe("/tickets");
    expect(findActiveItemHref("/documents")).toBe("/documents");
    expect(findActiveItemHref("/reports")).toBe("/reports");
    expect(findActiveItemHref("/administration")).toBe("/administration");
    expect(findActiveItemHref("/profile")).toBe("/profile");
  });

  it("highlights a parent module for plain record routes", () => {
    expect(findActiveItemHref("/opportunities/abc-123")).toBe("/opportunities");
    expect(findActiveItemHref("/companies/acme")).toBe("/companies");
    expect(findActiveItemHref("/contacts/jane")).toBe("/contacts");
  });

  it("legacy module records highlight the canonical module, never a hidden one", () => {
    // Customers/Leads are VIEWS of Contacts (Phase 2). A full-page customer or
    // lead record must highlight Contacts — never a redundant hidden sidebar
    // item — so no separate "Customers" module ever appears in the sidebar.
    expect(canonicalModulePath("/customers")).toBe("/contacts");
    expect(canonicalModulePath("/customers/xyz")).toBe("/contacts/xyz");
    expect(canonicalModulePath("/leads")).toBe("/contacts");
    expect(canonicalModulePath("/leads/lead-1")).toBe("/contacts/lead-1");
    expect(canonicalModulePath("/files")).toBe("/documents");
    expect(canonicalModulePath("/inbox")).toBe("/activities");
    expect(canonicalModulePath("/contacts/jane")).toBe("/contacts/jane");

    expect(findActiveItemHref("/customers/xyz")).toBe("/contacts");
    expect(findActiveItemHref("/leads/lead-1")).toBe("/contacts");
    expect(findActiveItemHref("/files")).toBe("/documents");
    expect(findActiveItemHref("/inbox")).toBe("/activities");
  });

  it("handles trailing-slash paths via the prefix rule", () => {
    expect(findActiveItemHref("/opportunities/")).toBe("/opportunities");
    expect(findActiveItemHref("/activities/calendar/")).toBe("/activities");
  });

  it("maps the merged kanban route to Opportunities only", () => {
    // Pipeline is no longer a separate sidebar item — /opportunities/kanban is a
    // compatibility URL for the Kanban VIEW of Opportunities, so only
    // Opportunities is highlighted.
    expect(findActiveItemHref("/opportunities/kanban")).toBe("/opportunities");
    expect(findActiveItemHref("/opportunities/kanban/abc-123")).toBe(
      "/opportunities"
    );
  });

  it("maps merged activities child routes to Activities only", () => {
    // Calendar / Tasks / Meetings / Email are VIEWS of Activities, so the
    // compatibility URLs highlight only Activities.
    expect(findActiveItemHref("/activities/calendar")).toBe("/activities");
    expect(findActiveItemHref("/activities/email")).toBe("/activities");
    expect(findActiveItemHref("/activities/meetings")).toBe("/activities");
    expect(findActiveItemHref("/activities/calendar/some-event")).toBe(
      "/activities"
    );
  });

  it("ignores query strings so view params still highlight the parent module", () => {
    expect(findActiveItemHref("/opportunities?view=kanban")).toBe(
      "/opportunities"
    );
    expect(findActiveItemHref("/opportunities?view=forecast&record=abc")).toBe(
      "/opportunities"
    );
    expect(findActiveItemHref("/activities?view=calendar")).toBe("/activities");
    expect(findActiveItemHref("/activities?view=email")).toBe("/activities");
    expect(findActiveItemHref("/activities?view=meetings&record=x")).toBe(
      "/activities"
    );
  });

  it("never highlights more than one item across the whole navigation", () => {
    const paths = [
      "/",
      "/dashboard",
      "/files",
      "/profile",
      "/companies",
      "/companies/acme",
      "/contacts",
      "/contacts/jane",
      "/customers",
      "/customers/xyz",
      "/leads",
      "/leads/lead-1",
      "/opportunities",
      "/opportunities/abc",
      "/opportunities/kanban",
      "/opportunities?view=kanban",
      "/quotes",
      "/invoices",
      "/activities",
      "/activities/calendar",
      "/activities/email",
      "/activities/meetings",
      "/activities?view=tasks",
      "/tickets",
      "/documents",
      "/reports",
      "/administration",
    ];

    for (const path of paths) {
      const activeHref = findActiveItemHref(path);
      if (activeHref === null) continue;

      const matches = navigation.flatMap((g) => g.items).filter(
        (item) => item.href === activeHref
      );
      expect(matches.length).toBe(1);
    }
  });

  it("only one item is active for every VISIBLE nav href", () => {
    // Hidden merged modules (Customers/Leads/Files/Inbox) intentionally
    // normalize to their canonical module — covered by the dedicated test.
    for (const group of navigation) {
      for (const item of group.items) {
        if (item.hidden) continue;
        const activeHref = findActiveItemHref(item.href);
        expect(activeHref).toBe(item.href);
      }
    }
  });

  it("no two nav items share the same href", () => {
    const hrefs = navigation.flatMap((g) => g.items).map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

/**
 * Phase 2 structure contract — locks in the simplified navigation:
 * - Visible groups: General / CRM / Sales / Work / Documents / Reports / Administration
 * - Leads + Customers are hidden views under Contacts (CRM)
 * - Inbox is a hidden view under Activities (Work)
 * - Sales contains exactly Opportunities, Quotes, Invoices
 * - Work merges Activities + Tickets
 * - Files / Profile stay hidden (deep-link only)
 */
describe("Phase 2 navigation structure", () => {
  const allItems = () => navigation.flatMap((g) => g.items);
  const group = (name: string) => navigation.find((g) => g.group === name);

  it("groups match the simplified target order", () => {
    expect(navigation.map((g) => g.group)).toEqual([
      "General",
      "CRM",
      "Sales",
      "Work",
      "Documents",
      "Reports",
      "Administration",
    ]);
  });

  it("Leads and Customers are hidden views under CRM (Contacts)", () => {
    const crm = group("CRM");
    expect(crm?.items.map((i) => i.title)).toEqual([
      "Companies",
      "Contacts",
      "Customers",
      "Leads",
    ]);
    expect(crm?.items.find((i) => i.title === "Leads")?.hidden).toBe(true);
    expect(crm?.items.find((i) => i.title === "Customers")?.hidden).toBe(true);
  });

  it("Sales contains only Opportunities, Quotes, Invoices (no Leads)", () => {
    const sales = group("Sales");
    expect(sales?.items.map((i) => i.title)).toEqual([
      "Opportunities",
      "Quotes",
      "Invoices",
    ]);
  });

  it("Work merges Activities + Tickets with Inbox hidden", () => {
    const work = group("Work");
    expect(work?.items.map((i) => i.title)).toEqual([
      "Activities",
      "Tickets",
      "Inbox",
    ]);
    expect(work?.items.find((i) => i.title === "Inbox")?.hidden).toBe(true);
  });

  it("visible items are exactly the simplified target set", () => {
    const visible = allItems()
      .filter((i) => !i.hidden)
      .map((i) => i.href);
    expect(visible).toEqual([
      "/dashboard",
      "/companies",
      "/contacts",
      "/opportunities",
      "/quotes",
      "/invoices",
      "/activities",
      "/tickets",
      "/documents",
      "/reports",
      "/administration",
    ]);
  });

  it("hidden merged routes still resolve deep links to their canonical module", () => {
    expect(findActiveItemHref("/leads")).toBe("/contacts");
    expect(findActiveItemHref("/customers")).toBe("/contacts");
    expect(findActiveItemHref("/inbox")).toBe("/activities");
    expect(findActiveItemHref("/files")).toBe("/documents");
    expect(findActiveItemHref("/leads/lead-1")).toBe("/contacts");
    expect(findActiveItemHref("/customers/xyz")).toBe("/contacts");
  });

  it("hidden items normalize to their canonical module (active-state contract)", () => {
    // Legacy merged modules normalize to their canonical module; other hidden
    // items (e.g. Profile) keep resolving to themselves.
    const canonical: Record<string, string> = {
      "/customers": "/contacts",
      "/leads": "/contacts",
      "/inbox": "/activities",
      "/files": "/documents",
    };
    for (const item of allItems().filter((i) => i.hidden)) {
      expect(findActiveItemHref(item.href)).toBe(canonical[item.href] ?? item.href);
    }
  });
});
