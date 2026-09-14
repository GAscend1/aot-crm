import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { classifyCalendarIssue } from "../../services/integration-gate";

// ---------------------------------------------------------------------------
// Rule: a single calendar request failure (e.g. an oversized range, throttling)
// must NEVER surface as "Microsoft 365 unavailable" while a prior sync proved
// Graph is connected ("Synced X ago"). Only auth/session failures map to the
// global connection banner.
// ---------------------------------------------------------------------------

describe("classifyCalendarIssue (calendar-specific states)", () => {
  it("keeps an oversized-range failure calendar-specific, not a global outage", () => {
    const issue = classifyCalendarIssue({
      code: "invalid_calendar_range:range_too_large",
      message: "The range between the start and end dates is greater than the allowed range. Maximum number of days: 1825",
    });
    expect(issue.kind).toBe("calendar");
    expect(issue.title).toBe("Calendar sync issue");
    expect(issue.message).not.toContain("unavailable");
  });

  it("treats a plain sync failure as a calendar issue too", () => {
    const issue = classifyCalendarIssue({
      code: "sync_failed",
      message: "Delta sync failed",
    });
    expect(issue.kind).toBe("calendar");
    expect(issue.title).toBe("Calendar sync issue");
  });

  it("maps throttling to a rate-limit issue, not an outage", () => {
    const issue = classifyCalendarIssue({ status: 429, message: "Too many requests" });
    expect(issue.kind).toBe("throttled");
    expect(issue.title).toMatch(/rate-limited/i);
  });

  it("maps a missing token to a global connection state (reconnect banner)", () => {
    const issue = classifyCalendarIssue({ code: "no_token" });
    expect(issue.kind).toBe("connection");
    expect(issue.state).toBe("SIGN_IN_REQUIRED");
  });

  it("maps 401 to TOKEN_EXPIRED connection state", () => {
    const issue = classifyCalendarIssue({ status: 401 });
    expect(issue.kind).toBe("connection");
    expect(issue.state).toBe("TOKEN_EXPIRED");
  });

  it("maps 403 to RECONSENT_REQUIRED connection state", () => {
    const issue = classifyCalendarIssue({ status: 403 });
    expect(issue.kind).toBe("connection");
    expect(issue.state).toBe("RECONSENT_REQUIRED");
  });
});

describe("CalendarView status handling (static)", () => {
  const src = readFileSync(
    join(process.cwd(), "app", "(app)", "activities", "views", "CalendarView.tsx"),
    "utf8"
  );

  it("classifies sync failures via classifyCalendarIssue, not classifyGraphError", () => {
    expect(src).toContain("classifyCalendarIssue");
    expect(src).not.toContain("classifyGraphError");
  });

  it("never uses the generic 'Microsoft 365 unavailable' title for calendar failures", () => {
    expect(src).not.toContain('"Microsoft 365 unavailable"');
  });

  it("only renders the global integration banner for connection states", () => {
    expect(src).toContain('calendarIssue.kind === "connection"');
  });

  it("renders a calendar-specific warning with a Retry action otherwise", () => {
    expect(src).toContain('title={calendarIssue.title}');
    expect(src).toContain('label: "Retry"');
  });

  it("fetches the visible month with a bounded window (calendarViewRange)", () => {
    expect(src).toContain("calendarViewRange");
  });

  it("prevents duplicate concurrent syncs", () => {
    expect(src).toContain("syncingRef");
  });
});
