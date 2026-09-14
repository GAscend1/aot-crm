import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CALENDAR_GRAPH_MAX_RANGE_DAYS,
  SYNC_FUTURE_DAYS,
  SYNC_PAST_DAYS,
  calendarRangeDays,
  calendarSyncWindow,
  calendarViewRange,
  validateCalendarRange,
} from "../../lib/calendar-range";

describe("calendarSyncWindow (background / manual sync)", () => {
  it("runs from the past 90 days to the next 365 days (455 days total)", () => {
    const now = new Date("2026-08-10T12:00:00.000Z");
    const { start, end } = calendarSyncWindow(now);
    expect(start.toISOString().startsWith("2026-05-12")).toBe(true); // 90 days before Aug 10
    expect(end.toISOString().startsWith("2027-08-10")).toBe(true); // 365 days after
    expect(calendarRangeDays(start.toISOString(), end.toISOString())).toBe(
      SYNC_PAST_DAYS + SYNC_FUTURE_DAYS
    );
  });

  it("starts at midnight UTC and ends at end-of-day UTC", () => {
    const now = new Date("2026-08-10T12:00:00.000Z");
    const { start, end } = calendarSyncWindow(now);
    expect(start.toISOString()).toMatch(/T00:00:00\.000Z$/);
    expect(end.toISOString()).toMatch(/T23:59:59\.999Z$/);
  });

  it("stays far below the Graph 1825-day limit", () => {
    const now = new Date();
    const { start, end } = calendarSyncWindow(now);
    expect(calendarRangeDays(start.toISOString(), end.toISOString())).toBeLessThan(
      CALENDAR_GRAPH_MAX_RANGE_DAYS
    );
  });
});

describe("calendarViewRange (visible month/week/day)", () => {
  it("month window covers the anchor month plus a small buffer", () => {
    const anchor = new Date(2026, 7, 15, 12, 0, 0); // Aug 15, 2026 (local)
    const { start, end } = calendarViewRange("month", anchor);
    const startDate = new Date(start);
    const endDate = new Date(end);
    // Buffer: 7 days before Aug 1 (→ July 25) and 7 days after Aug 31.
    expect(startDate.getMonth()).toBe(6); // July
    expect(startDate.getDate()).toBe(25);
    expect(endDate.getMonth()).toBe(8); // September
    expect(endDate.getDate()).toBeLessThanOrEqual(7);
    expect(calendarRangeDays(start, end)).toBeLessThanOrEqual(45);
    expect(calendarRangeDays(start, end)).toBeGreaterThanOrEqual(30);
  });

  it("previous month window is one month earlier", () => {
    const aug = new Date(2026, 7, 15, 12, 0, 0);
    const jul = new Date(2026, 6, 15, 12, 0, 0);
    const augRange = calendarViewRange("month", aug);
    const julRange = calendarViewRange("month", jul);
    expect(new Date(julRange.start).getTime()).toBeLessThan(
      new Date(augRange.start).getTime()
    );
    expect(
      calendarRangeDays(julRange.start, julRange.end)
    ).toBeLessThanOrEqual(45);
  });

  it("next month window is one month later", () => {
    const aug = new Date(2026, 7, 15, 12, 0, 0);
    const sep = new Date(2026, 8, 15, 12, 0, 0);
    expect(
      new Date(calendarViewRange("month", sep).start).getTime()
    ).toBeGreaterThan(
      new Date(calendarViewRange("month", aug).start).getTime()
    );
  });

  it("week window covers exactly the visible week plus buffer", () => {
    const anchor = new Date(2026, 7, 12, 12, 0, 0); // Wed Aug 12, 2026
    const { start, end } = calendarViewRange("week", anchor);
    // Monday-first week of Aug 10–16, plus 7 days buffer each side.
    expect(calendarRangeDays(start, end)).toBeLessThanOrEqual(21);
    expect(new Date(start).getDay()).toBe(1); // buffer start lands on a Monday
  });

  it("day window covers one day plus buffer", () => {
    const anchor = new Date(2026, 7, 12, 12, 0, 0);
    const { start, end } = calendarViewRange("day", anchor);
    expect(calendarRangeDays(start, end)).toBeLessThanOrEqual(15);
    expect(calendarRangeDays(start, end)).toBeGreaterThanOrEqual(14);
  });
});

describe("calendar-sync.service full-pull regression (static)", () => {
  const src = readFileSync(
    join(process.cwd(), "services", "calendar-sync.service.ts"),
    "utf8"
  );

  it("no longer requests the 2000→2100 unbounded sentinel", () => {
    expect(src).not.toContain("2000-01-01");
    expect(src).not.toContain("2100-01-01");
  });

  it("builds the full-pull range from the bounded CRM sync window", () => {
    expect(src).toContain("calendarSyncWindow()");
    expect(src).toContain("syncWindow.start.toISOString()");
  });

  it("treats only 410 Gone as delta-cursor expiry (not 400)", () => {
    expect(src).toContain("err.status === 410");
    expect(src).not.toContain("err.status === 410 || err.status === 400");
  });

  it("logs only the requested range length (no tokens)", () => {
    expect(src).toContain("full pull range");
    expect(src).toContain("days");
  });
});

describe("validateCalendarRange (defensive gate before Graph)", () => {
  it("rejects missing or unparseable dates", () => {
    expect(validateCalendarRange(null, "2026-08-10T00:00:00Z").ok).toBe(false);
    expect(validateCalendarRange("nope", "2026-08-10T00:00:00Z").ok).toBe(false);
  });

  it("rejects end before start", () => {
    const r = validateCalendarRange("2026-08-10T00:00:00Z", "2026-08-01T00:00:00Z");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("end_before_start");
  });

  it("rejects the old 2000 → 2100 sentinel (36525 days)", () => {
    const r = validateCalendarRange("2000-01-01T00:00:00Z", "2100-01-01T00:00:00Z");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("range_too_large");
    expect(calendarRangeDays("2000-01-01T00:00:00Z", "2100-01-01T00:00:00Z")).toBeGreaterThan(
      CALENDAR_GRAPH_MAX_RANGE_DAYS
    );
  });

  it("accepts exactly the 1825-day maximum", () => {
    const start = "2026-01-01T00:00:00.000Z";
    const end = new Date(Date.parse(start) + 1825 * 86_400_000).toISOString();
    expect(calendarRangeDays(start, end)).toBe(1825);
    expect(validateCalendarRange(start, end).ok).toBe(true);
  });

  it("rejects anything beyond 1825 days", () => {
    const start = "2026-01-01T00:00:00.000Z";
    const end = new Date(Date.parse(start) + 1826 * 86_400_000).toISOString();
    const r = validateCalendarRange(start, end);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("range_too_large");
  });

  it("accepts a normal 30-day range", () => {
    const r = validateCalendarRange("2026-08-01T00:00:00Z", "2026-08-31T00:00:00Z");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.days).toBe(30);
  });
});
