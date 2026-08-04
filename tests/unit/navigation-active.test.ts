import { describe, it, expect } from "vitest";

import { findActiveItemHref, navigation } from "@/config/navigation";

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
    expect(findActiveItemHref("/customers")).toBe("/customers");
    expect(findActiveItemHref("/leads")).toBe("/leads");
    expect(findActiveItemHref("/opportunities")).toBe("/opportunities");
    expect(findActiveItemHref("/quotes")).toBe("/quotes");
    expect(findActiveItemHref("/invoices")).toBe("/invoices");
    expect(findActiveItemHref("/activities")).toBe("/activities");
    expect(findActiveItemHref("/tickets")).toBe("/tickets");
    expect(findActiveItemHref("/documents")).toBe("/documents");
    expect(findActiveItemHref("/reports")).toBe("/reports");
    expect(findActiveItemHref("/administration")).toBe("/administration");
    expect(findActiveItemHref("/profile")).toBe("/profile");
    expect(findActiveItemHref("/files")).toBe("/files");
  });

  it("highlights a parent module for plain record routes", () => {
    expect(findActiveItemHref("/opportunities/abc-123")).toBe("/opportunities");
    expect(findActiveItemHref("/companies/acme")).toBe("/companies");
    expect(findActiveItemHref("/contacts/jane")).toBe("/contacts");
    expect(findActiveItemHref("/customers/xyz")).toBe("/customers");
    expect(findActiveItemHref("/leads/lead-1")).toBe("/leads");
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

  it("only one item is active for every configured nav href", () => {
    for (const group of navigation) {
      for (const item of group.items) {
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
