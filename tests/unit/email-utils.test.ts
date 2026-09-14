import { describe, expect, it } from "vitest";

import { emailTextFromHtml, formatBytes, normalizeEmail } from "../../lib/email-utils";

describe("emailTextFromHtml (safe body rendering)", () => {
  it("passes plain text through unchanged", () => {
    expect(emailTextFromHtml("Hello world")).toBe("Hello world");
  });

  it("extracts text content from HTML", () => {
    expect(emailTextFromHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("never preserves executable script content", () => {
    const html = "<p>Safe</p><script>window.hacked = true; document.body.innerHTML = '';</script><p>After</p>";
    const text = emailTextFromHtml(html);
    expect(text).not.toContain("window.hacked");
    expect(text).not.toContain("script");
    expect(text).toContain("Safe");
  });

  it("strips event handlers and styles", () => {
    const html = '<a href="https://evil.test" onclick="steal()">link</a><style>.x{}</style>';
    const text = emailTextFromHtml(html);
    expect(text).not.toContain("onclick");
    expect(text).not.toContain("steal");
    expect(text).toContain("link");
  });

  it("returns empty string for empty input", () => {
    expect(emailTextFromHtml("")).toBe("");
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims addresses", () => {
    expect(normalizeEmail("  Customer@Contoso.COM ")).toBe("customer@contoso.com");
  });

  it("handles null/undefined", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("formatBytes", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("handles missing sizes", () => {
    expect(formatBytes(null)).toBe("");
  });
});
