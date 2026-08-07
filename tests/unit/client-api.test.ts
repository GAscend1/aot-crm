import { describe, it, expect } from "vitest";
import { buildQueryString } from "@/lib/client/api";

describe("buildQueryString", () => {
  it("skips undefined, null, and empty values", () => {
    expect(buildQueryString({ a: "1", b: undefined, c: null, d: "" })).toBe("?a=1");
  });

  it("handles numbers and booleans", () => {
    expect(buildQueryString({ page: 2, enabled: true })).toBe("?page=2&enabled=true");
  });

  it("encodes special characters", () => {
    expect(buildQueryString({ q: "a b&c=d" })).toBe("?q=a+b%26c%3Dd");
  });

  it("returns an empty string when there is nothing to serialize", () => {
    expect(buildQueryString({ a: undefined, b: "" })).toBe("");
  });
});
