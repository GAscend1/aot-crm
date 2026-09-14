import { describe, expect, it, vi, afterEach } from "vitest";

import { resolveGraphUrl } from "../../services/graph-server";

describe("resolveGraphUrl (Microsoft Graph request URL resolution)", () => {
  it("prefixes relative paths with the v1.0 base", () => {
    expect(resolveGraphUrl("/me")).toBe("https://graph.microsoft.com/v1.0/me");
    expect(resolveGraphUrl("/me/events")).toBe(
      "https://graph.microsoft.com/v1.0/me/events",
    );
  });

  it("prefixes paths missing the leading slash", () => {
    expect(resolveGraphUrl("me/calendarview")).toBe(
      "https://graph.microsoft.com/v1.0/me/calendarview",
    );
  });

  it("passes absolute URLs through untouched (nextLink/deltaLink)", () => {
    const absolute =
      "https://graph.microsoft.com/v1.0/me/events?$select=id%2CchangeKey&$skiptoken=abc123";
    expect(resolveGraphUrl(absolute)).toBe(absolute);
  });

  it("passes absolute delta links through untouched", () => {
    const delta =
      "https://graph.microsoft.com/v1.0/me/events/delta?$skiptoken=xyz&$deltatoken=delta-token";
    expect(resolveGraphUrl(delta)).toBe(delta);
  });

  it("never produces the malformed v1.0https: concatenation", () => {
    const absolute = "https://graph.microsoft.com/v1.0/me/events";
    const resolved = resolveGraphUrl(absolute);
    expect(resolved).not.toContain("v1.0https:");
    expect(resolved).not.toContain("/v1.0https://");
  });

  it("preserves query strings on relative paths", () => {
    expect(resolveGraphUrl("/me/calendarview?startDateTime=2026-01-01T00:00:00Z")).toBe(
      "https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=2026-01-01T00:00:00Z",
    );
  });
});

describe("graphFetch failure diagnostics (safe logging)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("logs only safe metadata and redacts paging tokens from the path", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "Invalid version: v1.0https:", code: "InvalidVersion" },
          }),
          { status: 400, headers: { "request-id": "req-123" } },
        ),
      ),
    );

    const { graphFetch } = await import("../../services/graph-server");
    await expect(
      graphFetch("fake-token", "https://graph.microsoft.com/v1.0/me/events?$skiptoken=secret-cursor"),
    ).rejects.toThrow("Invalid version");

    const logged = errorSpy.mock.calls.map((c) => c.map(String).join(" ")).join(" ");
    expect(logged).toContain("urlAbsolute");
    expect(logged).toContain("status");
    expect(logged).toContain("code");
    expect(logged).toContain("requestId");
    expect(logged).toContain("version");
    // Opaque paging cursors must never reach logs.
    expect(logged).not.toContain("secret-cursor");
    // The operation is echoed (safe), but the full absolute URL is redacted to
    // keep paging tokens out while preserving the relative/absolute signal.
    expect(logged).toContain("skiptoken=redacted");
  });

  it("never logs the access token or Authorization header", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: "denied", code: "forbidden" } }),
          { status: 403, headers: { "request-id": "req-456" } },
        ),
      ),
    );

    const { graphFetch } = await import("../../services/graph-server");
    await expect(graphFetch("super-secret-token", "/me")).rejects.toThrow();

    const logged = errorSpy.mock.calls.map((c) => c.map(String).join(" ")).join(" ");
    expect(logged).not.toContain("super-secret-token");
    expect(logged).not.toContain("Bearer");
  });
});
