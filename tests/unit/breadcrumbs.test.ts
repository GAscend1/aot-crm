import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Breadcrumb contract:
// - Full-page records show the human-readable name, never a raw UUID as the
//   primary label (Home > People > Jane Doe, not Home > People > <uuid>).
// - Legacy module segments (customers) render under the canonical People label.
// - The record name is resolved org-scoped from the existing record API.
// ---------------------------------------------------------------------------

describe("Breadcrumbs (components/enterprise/Breadcrumbs.tsx)", () => {
  const src = readFileSync(
    join(process.cwd(), "components", "enterprise", "Breadcrumbs.tsx"),
    "utf8"
  );

  it("maps the legacy customers segment to the canonical People label", () => {
    expect(src).toMatch(/customers:\s*"People"/);
    expect(src).toMatch(/contacts:\s*"People"/);
  });

  it("resolves human-readable names for record detail paths (no raw UUID)", () => {
    expect(src).toContain("UUID_RE");
    expect(src).toContain("RECORD_ENTITIES");
    expect(src).toMatch(/contacts:\s*\{\s*pick/);
    expect(src).toMatch(/customers:\s*\{\s*pick/);
  });

  it("fetches the record name from the existing org-scoped record API", () => {
    expect(src).toContain("fetch(`/api/${entity}/${id}`");
    expect(src).toContain('cache: "no-store"');
  });

  it("renders a neutral ellipsis instead of the raw id while the name loads", () => {
    expect(src).toContain("isRecordPath && pending");
    expect(src).toContain('? "…"');
  });

  it("still surfaces the active module view as a sub-crumb (People → Customers)", () => {
    expect(src).toContain("customers: \"Customers\"");
    expect(src).toContain("viewLabelMap");
  });
});
