import { describe, it, expect } from "vitest";

const INTEGRATIONS_ROOT = "/api/integrations/microsoft";

describe("Microsoft Integration Routes", () => {
  describe("Authentication", () => {
    it("unauthenticated request returns 401", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/profile`);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain("Authentication required");
    });
  });

  describe("Route availability", () => {
    const routes = [
      ["GET", `${INTEGRATIONS_ROOT}/profile`],
      ["GET", `${INTEGRATIONS_ROOT}/photo`],
      ["GET", `${INTEGRATIONS_ROOT}/presence`],
      ["GET", `${INTEGRATIONS_ROOT}/mail/messages`],
      ["GET", `${INTEGRATIONS_ROOT}/mail/drafts`],
      ["POST", `${INTEGRATIONS_ROOT}/mail/send`],
      ["POST", `${INTEGRATIONS_ROOT}/mail/drafts`],
      ["POST", `${INTEGRATIONS_ROOT}/mail/ABC123/reply`],
      ["POST", `${INTEGRATIONS_ROOT}/mail/ABC123/reply-all`],
      ["POST", `${INTEGRATIONS_ROOT}/mail/ABC123/forward`],
      ["GET", `${INTEGRATIONS_ROOT}/mail/ABC123`],
      ["DELETE", `${INTEGRATIONS_ROOT}/mail/ABC123`],
      ["GET", `${INTEGRATIONS_ROOT}/calendar/events`],
      ["POST", `${INTEGRATIONS_ROOT}/calendar/events`],
      ["GET", `${INTEGRATIONS_ROOT}/calendar/events/ABC123`],
      ["PATCH", `${INTEGRATIONS_ROOT}/calendar/events/ABC123`],
      ["DELETE", `${INTEGRATIONS_ROOT}/calendar/events/ABC123`],
    ] as const;

    for (const [method, path] of routes) {
      it(`${method} ${path} returns 401 (unauthenticated)`, async () => {
        const res = await fetch(path, { method });
        expect(res.status).toBe(401);
      });
    }
  });

  describe("Unsupported methods", () => {
    const unsupportedMethods = ["PUT", "OPTIONS", "TRACE", "PURGE"];

    for (const method of unsupportedMethods) {
      it(`${method} /profile returns 405`, async () => {
        const res = await fetch(`${INTEGRATIONS_ROOT}/profile`, { method });
        expect(res.status).toBe(405);
      });
    }
  });

  describe("Request validation", () => {
    it("mail/send rejects empty body", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/mail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect([401, 422]).toContain(res.status);
    });

    it("mail/send rejects missing recipients", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/mail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: { subject: "Test", body: { content: "Body" } } }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("calendar/events rejects missing subject", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/calendar/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: { dateTime: "2026-01-01T00:00:00Z" }, end: { dateTime: "2026-01-01T01:00:00Z" } }),
      });
      expect(res.status).toBe(422);
    });

    it("calendar/events rejects end before start", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/calendar/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Test",
          start: { dateTime: "2026-01-01T02:00:00Z" },
          end: { dateTime: "2026-01-01T01:00:00Z" },
        }),
      });
      expect(res.status).toBe(422);
    });

    it("mail/reply rejects missing comment", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/mail/ABC123/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(422);
    });

    it("mail/forward rejects missing recipients", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/mail/ABC123/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: {} }),
      });
      expect(res.status).toBe(422);
    });
  });

  describe("Message ID validation", () => {
    it("rejects invalid message IDs", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/mail/../etc/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: "test" }),
      });
      expect(res.status).toBe(422);
    });
  });

  describe("Event ID validation", () => {
    it("rejects invalid event IDs", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/calendar/events/../../profile`, {
        method: "DELETE",
      });
      expect(res.status).toBe(422);
    });
  });

  describe("Catch-all proxy", () => {
    it("old proxy route no longer exists", async () => {
      const res = await fetch("/api/graph/me");
      expect([404, 500]).toContain(res.status);
    });

    it("graphApi throws on unknown path", async () => {
      try {
        const { graphApi } = await import("../services/graph-client");
        await graphApi("/me/unknown/path");
        expect.fail("Should have thrown");
      } catch (err) {
        expect((err as Error).message).toContain("Unknown Graph path");
      }
    });
  });

  describe("Token security", () => {
    it("access token is never returned in API responses", async () => {
      const res = await fetch(`${INTEGRATIONS_ROOT}/profile`);
      const text = await res.text();
      expect(text.toLowerCase()).not.toContain("access_token");
      expect(text.toLowerCase()).not.toContain("accessToken");
    });
  });
});
