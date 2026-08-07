import { prisma } from "@/lib/prisma";
import { GraphServerError, refreshGraphToken } from "@/services/graph-server";
import { encryptSecret, decryptSecret } from "./token-crypto";

/**
 * Server-side Microsoft Graph token store (server-only).
 *
 * The CRM uses JWT sessions, so Graph tokens normally live only in the session
 * cookie. Background workers (retry queue, delta polling) and Graph webhooks
 * have no browser session, so the Auth.js jwt callback persists an encrypted
 * copy of each user's refresh token here; workers refresh it on demand.
 */

/** Persist (or rotate) the encrypted refresh token, keyed by the user's email. Never throws. */
export async function persistGraphRefreshToken(
  email: string | null | undefined,
  refreshToken: string | null | undefined,
): Promise<void> {
  if (!email || !refreshToken) return;
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return;
    await prisma.graphToken.upsert({
      where: { userId: user.id },
      update: { refreshToken: encryptSecret(refreshToken) },
      create: { userId: user.id, refreshToken: encryptSecret(refreshToken) },
    });
  } catch (err) {
    // Never block authentication because persistence failed.
    console.error("[graph-tokens] persist failed:", err instanceof Error ? err.message : err);
  }
}

/** Drop the stored token (e.g. when a refresh permanently fails). Never throws. */
export async function clearGraphRefreshToken(email: string | null | undefined): Promise<void> {
  if (!email) return;
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return;
    await prisma.graphToken.deleteMany({ where: { userId: user.id } });
  } catch {
    // noop
  }
}

/** Decrypt the stored refresh token for a user, or null when none exists. */
export async function getRefreshTokenForUser(userId: string): Promise<string | null> {
  const row = await prisma.graphToken.findUnique({ where: { userId } });
  if (!row) return null;
  try {
    return decryptSecret(row.refreshToken);
  } catch {
    // Undecryptable (rotated AUTH_SECRET, corruption) — drop so workers retry cleanly.
    await prisma.graphToken.deleteMany({ where: { userId } });
    return null;
  }
}

async function rotateStoredRefreshToken(userId: string, refreshToken: string): Promise<void> {
  await prisma.graphToken.update({
    where: { userId },
    data: { refreshToken: encryptSecret(refreshToken) },
  });
}

/**
 * Resolve a fresh Graph access token for a user with no browser session
 * (background queue worker / webhook). Refreshes from the stored token and
 * rotates it when Microsoft issues a new one. Throws GraphServerError when no
 * stored session exists or the refresh fails.
 */
export async function getAccessTokenForUser(userId: string): Promise<string> {
  const refreshToken = await getRefreshTokenForUser(userId);
  if (!refreshToken) {
    throw new GraphServerError(
      "No stored Microsoft session for this user — they must sign in once to enable background sync.",
      401,
      "no_stored_token",
    );
  }

  const refreshed = await refreshGraphToken(refreshToken);
  if (refreshed.refreshToken && refreshed.refreshToken !== refreshToken) {
    try {
      await rotateStoredRefreshToken(userId, refreshed.refreshToken);
    } catch {
      // Rotation failure is non-fatal — the old token still works until expiry.
    }
  }
  return refreshed.accessToken;
}
