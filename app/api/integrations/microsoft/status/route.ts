import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { graphFetch } from "@/services/graph-server";
import {
  buildIntegrationStatus,
  detectIntegrationState,
  isGraphEnabled,
  type IntegrationState,
} from "@/services/integration-gate";

export const dynamic = "force-dynamic";

/**
 * Lightweight reachability probe — a single /me call with a short timeout.
 * Only runs when live mode is on, a signed-in token exists, and the token is
 * not already expired. Failures surface as GRAPH_UNAVAILABLE.
 */
async function probeGraph(accessToken: string): Promise<boolean> {
  try {
    await graphFetch(accessToken, "/me?$select=id", {
      signal: AbortSignal.timeout(4_000),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Runtime Microsoft 365 integration status.
 *
 * States: CONNECTED | SIGN_IN_REQUIRED | RECONSENT_REQUIRED | TOKEN_EXPIRED |
 * CONFIGURATION_ERROR | GRAPH_UNAVAILABLE. Computed from live signals — the
 * old hand-configured "pending" mode no longer exists.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  // Multi-tenant mode: the authority is `organizations`, so a tenant ID is no
  // longer required for the integration to be considered configured.
  const configComplete = Boolean(
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      secret,
  );

  let signedIn = false;
  let tokenExpired: boolean | undefined;
  let authError: string | null | undefined;
  let accessToken: string | null = null;

  if (configComplete) {
    try {
      const token = await getToken({ req, secret });
      signedIn = typeof token?.accessToken === "string" && token.accessToken.length > 20;
      tokenExpired = token?.expiresAt
        ? Date.now() > (token.expiresAt as number) * 1000
        : undefined;
      authError = token?.authError ?? null;
      accessToken = signedIn ? (token?.accessToken as string) : null;
    } catch {
      signedIn = false;
    }
  }

  // Probe Graph only when the session/token look healthy — this is what makes
  // GRAPH_UNAVAILABLE a real, detectable state.
  let reachable: boolean | undefined;
  if (isGraphEnabled() && signedIn && !tokenExpired && accessToken) {
    reachable = await probeGraph(accessToken);
  }

  const state = detectIntegrationState({
    configComplete,
    signedIn,
    tokenExpired,
    authError,
    reachable,
  });

  const status = buildIntegrationStatus(state, {
    detail: detailFor(state, { configComplete, signedIn, tokenExpired }),
  });

  return NextResponse.json(status);
}

function detailFor(
  state: IntegrationState,
  signals: { configComplete: boolean; signedIn: boolean; tokenExpired?: boolean },
): string | undefined {
  switch (state) {
    case "CONFIGURATION_ERROR":
      return "Missing AUTH_MICROSOFT_ENTRA_ID_ID / AUTH_MICROSOFT_ENTRA_ID_SECRET / AUTH_SECRET.";
    case "SIGN_IN_REQUIRED":
      return signals.configComplete ? "No signed-in session with a stored Microsoft token." : "Credentials not configured.";
    case "TOKEN_EXPIRED":
      return "The access token expired and could not be refreshed. Reauthentication required.";
    case "RECONSENT_REQUIRED":
      return "The token exchange returned a consent/authorization error.";
    case "CONNECTED":
      return signals.tokenExpired ? "Token refreshed." : "Valid session with Microsoft token.";
    default:
      return undefined;
  }
}
