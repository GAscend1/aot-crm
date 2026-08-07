import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * At-rest encryption for server-stored secrets (Microsoft refresh tokens).
 * AES-256-GCM with a key derived from AUTH_SECRET — the same secret already
 * protecting the session JWTs, so no new secret material needs provisioning.
 * Encrypted values are `iv.tag.ciphertext` base64 triplets.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function deriveKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required to encrypt at-rest secrets");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted secret");
  }
  const decipher = createDecipheriv(ALGORITHM, deriveKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
