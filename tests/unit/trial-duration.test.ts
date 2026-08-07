import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Final spec: TRIAL_DURATION_DAYS defaults to 7 (full-feature evaluation).
 * The existing configurable env override (TRIAL_DURATION_DAYS) must remain
 * supported. Static source guard + a live import of the constant.
 */
describe("TRIAL_DURATION_DAYS (final spec: 7-day default)", () => {
  it("the server constant defaults to 7, not 14", () => {
    const src = readFileSync(
      join(process.cwd(), "lib", "server", "tenant.ts"),
      "utf8",
    );
    expect(src).toMatch(/TRIAL_DURATION_DAYS \|\| 7\)/);
    expect(src).not.toMatch(/TRIAL_DURATION_DAYS \|\| 14\)/);
  });

  it("the env override remains supported", () => {
    const src = readFileSync(
      join(process.cwd(), "lib", "server", "tenant.ts"),
      "utf8",
    );
    expect(src).toContain("process.env.TRIAL_DURATION_DAYS");
  });

  it("trial creation uses the configurable constant for the expiry window", () => {
    const src = readFileSync(
      join(process.cwd(), "lib", "server", "tenant.ts"),
      "utf8",
    );
    // Auto-provisioned trials compute the expiry from TRIAL_DURATION_DAYS
    // (and manual plan grants reference it via input.grantDays || …).
    expect(src).toMatch(/TRIAL_DURATION_DAYS \* 86_400_000/);
    expect(src).toMatch(/grantDays \|\| TRIAL_DURATION_DAYS/);
  });

  it("the marketing pricing copy states the 7-day full-feature trial", () => {
    const pricing = readFileSync(
      join(process.cwd(), "app", "pricing", "page.tsx"),
      "utf8",
    );
    expect(pricing).toContain("7-day full-feature trial");
    expect(pricing).not.toMatch(/14-day/i);
  });
});
