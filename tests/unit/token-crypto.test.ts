import { describe, expect, it, beforeAll } from "vitest";

import { decryptSecret, encryptSecret } from "../../lib/server/token-crypto";

describe("token-crypto (at-rest encryption)", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-for-calendar-sync-tests";
  });

  it("round-trips a refresh token", () => {
    const token = "MOCK_REFRESH_TOKEN_12345";
    const encrypted = encryptSecret(token);
    // Encrypted form must not leak the plaintext and must be structurally a triplet.
    expect(encrypted).not.toContain(token);
    expect(encrypted.split(".")).toHaveLength(3);
    expect(decryptSecret(encrypted)).toBe(token);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const token = "SAME_TOKEN";
    expect(encryptSecret(token)).not.toBe(encryptSecret(token));
  });

  it("rejects tampered ciphertext", () => {
    const token = "TAMPER_TEST_TOKEN";
    const [iv, tag, data] = encryptSecret(token).split(".");
    const flipped = data.endsWith("A") ? data.slice(0, -1) + "B" : data.slice(0, -1) + "A";
    expect(() => decryptSecret([iv, tag, flipped].join("."))).toThrow();
  });

  it("rejects malformed payloads", () => {
    expect(() => decryptSecret("not-a-triplet")).toThrow();
  });
});
