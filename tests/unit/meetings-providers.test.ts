import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { GraphClientError } from "@/services/graph-client";
import { classifyTeamsError } from "@/services/integration-gate";

// ---------------------------------------------------------------------------
// Rule: Microsoft Teams and Zoom are INDEPENDENT providers. A Teams failure
// must never be reported as a generic "Microsoft 365 unavailable" (Outlook
// Calendar may be perfectly connected), and Zoom not being configured is a
// graceful NOT CONFIGURED state — not an error.
// ---------------------------------------------------------------------------

describe("classifyTeamsError (provider-specific states)", () => {
  it("labels Graph unavailability as 'Microsoft Teams unavailable', not 'Microsoft 365 unavailable'", () => {
    const status = classifyTeamsError(new GraphClientError("boom", 503, "graph_unavailable"));
    expect(status.title).toBe("Microsoft Teams unavailable");
    expect(status.message).toMatch(/Unable to load\/create Teams meetings/);
    expect(status.state).toBe("GRAPH_UNAVAILABLE");
    expect(status.action).toBe("retry");
  });

  it("maps a missing token to SIGN_IN_REQUIRED with Teams copy", () => {
    const status = classifyTeamsError(new GraphClientError("no token", 0, "no_token"));
    expect(status.state).toBe("SIGN_IN_REQUIRED");
    expect(status.title).toBe("Microsoft Teams unavailable");
  });

  it("maps 401 to TOKEN_EXPIRED", () => {
    const status = classifyTeamsError(new GraphClientError("expired", 401, "token_expired"));
    expect(status.state).toBe("TOKEN_EXPIRED");
  });

  it("maps 403 to RECONSENT_REQUIRED (permission/consent — not a blanket outage)", () => {
    const status = classifyTeamsError(new GraphClientError("forbidden", 403, "consent"));
    expect(status.state).toBe("RECONSENT_REQUIRED");
  });

  it("maps an entitlement rejection (plan) to NOT_CONFIGURED with the exact plan message", () => {
    const status = classifyTeamsError(
      new Error("teams is not included in your current plan. Upgrade to unlock it.")
    );
    expect(status.state).toBe("NOT_CONFIGURED");
    expect(status.title).toBe("Microsoft Teams unavailable");
    expect(status.message).toContain("not included in your current plan");
  });
});

describe("MeetingsView treats Teams and Zoom independently (static)", () => {
  const src = readFileSync(
    join(process.cwd(), "app", "(app)", "activities", "views", "MeetingsView.tsx"),
    "utf8"
  );

  it("classifies Teams failures via classifyTeamsError (never generic M365)", () => {
    expect(src).toContain("classifyTeamsError(teamsResult.reason)");
  });

  it("skips the Zoom API entirely when Zoom is not configured", () => {
    expect(src).toContain("zoomConfigured ? zoomService.getMeetings()");
  });

  it("renders the graceful 'Zoom is not configured' state", () => {
    expect(src).toContain("Zoom is not configured");
    expect(src).toContain("NOT CONFIGURED");
  });

  it("no longer sets a combined 'Microsoft Teams or Zoom may be unavailable' error", () => {
    expect(src).not.toContain("Microsoft Teams or Zoom may be unavailable");
  });

  it("uses an accurate per-section state chip", () => {
    expect(src).toContain("<StateChip");
  });
});

describe("Zoom service surfaces the API's exact message (static)", () => {
  const src = readFileSync(
    join(process.cwd(), "services", "zoom.service.ts"),
    "utf8"
  );

  it("preserves the route error message so NOT CONFIGURED is detectable", () => {
    expect(src).toContain("body.error ||");
  });
});

describe("TeamsMeetingDialog copy is Teams-specific (static)", () => {
  const src = readFileSync(
    join(process.cwd(), "components", "integrations", "TeamsMeetingDialog.tsx"),
    "utf8"
  );

  it("never shows 'Microsoft 365 unavailable' as the primary Teams failure title", () => {
    // The generic title string must not appear in the failure branch.
    expect(src).not.toContain('?? "Microsoft 365 unavailable"');
    expect(src).toContain(": \"Microsoft Teams unavailable\"");
  });

  it("offers Teams-specific copy when the status cannot be reached", () => {
    expect(src).toContain("Unable to load/create Teams meetings");
  });
});
