import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { msTokenUrl } from "@/lib/server/ms-auth";
import { secureCookiesEnabled } from "@/lib/server/auth-env";

export class GraphServerError extends Error {
  status: number;
  code?: string;
  /** Microsoft Graph `request-id` header — safe to log, never a token. */
  requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = "GraphServerError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

/**
 * Resolve a Graph request URL. Microsoft Graph `@odata.nextLink` and
 * `@odata.deltaLink` values are ALREADY absolute URLs — unconditionally
 * prepending the v1.0 base again produced the "Invalid version: v1.0https:"
 * failure for calendar delta/next pages. Absolute URLs pass through untouched;
 * only relative paths get the base prefix. Exported for unit tests.
 */
export function resolveGraphUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${GRAPH_BASE_URL}${clean}`;
}

/**
 * Safe, structured failure diagnostics: operation, HTTP status, Graph error
 * code, Microsoft request-id, whether the request URL was relative or absolute,
 * and the Graph API version. Never logs tokens, cookies, secrets or content.
 */
function logGraphFailure(path: string, err: GraphServerError): void {
  // Redact opaque paging cursors ($skiptoken / $deltatoken) from the logged
  // path — they are Graph tokens and must never reach logs. `urlAbsolute` is
  // the requested "relative or absolute" signal.
  const safePath = path
    .replace(/([?&])\$?skiptoken=[^&\s]+/gi, "$1skiptoken=redacted")
    .replace(/([?&])\$?deltatoken=[^&\s]+/gi, "$1deltatoken=redacted");
  console.error(
    "[microsoft-graph] request failed",
    JSON.stringify({
      operation: safePath,
      status: err.status,
      code: err.code,
      requestId: err.requestId,
      urlAbsolute: /^https?:\/\//i.test(path),
      version: "v1.0",
    }),
  );
}

/** Build a GraphServerError from a failed Graph response, redacting tokens. */
function toGraphServerError(
  res: Response,
  body: { error?: { message?: string; code?: string } },
): GraphServerError {
  const graphMessage = body.error?.message;
  const safeMessage = graphMessage
    ? graphMessage.replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
                   .replace(/access_token[^&\s]+/gi, "access_token=[redacted]")
    : `Graph API returned status ${res.status}`;

  // request-id is Microsoft's correlation id for the failed call — safe to log.
  return new GraphServerError(
    safeMessage,
    res.status,
    body.error?.code,
    res.headers.get("request-id") ?? undefined,
  );
}

export async function getGraphToken(req?: NextRequest): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  // In production the Auth.js session cookie is `__Secure-authjs.session-token`
  // (secure cookie policy). getToken() only scans for the secure-prefixed name
  // when told to — otherwise it looks for the unprefixed dev name and returns
  // null, which surfaced as `no_token` (401) for every Graph call on Azure.
  const token = await getToken({
    req: req as never,
    secret,
    secureCookie: secureCookiesEnabled(),
  });
  const accessToken = token?.accessToken;

  if (!accessToken || typeof accessToken !== "string" || accessToken.length < 20) {
    throw new GraphServerError(
      "No valid Microsoft Graph access token. Reauthentication required — sign out and sign in again.",
      401,
      "no_token",
    );
  }

  return accessToken;
}

export async function refreshGraphToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  // Multi-tenant authority (organizations) — matches the login issuer so refresh
  // works for users from any Entra tenant.
  const url = msTokenUrl();
  const body = new URLSearchParams({
    client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
    client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(url, { method: "POST", body });
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new GraphServerError(
      "Session expired. Reauthentication required — sign out and sign in again.",
      401,
      "refresh_failed",
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function graphFetch(accessToken: string, path: string, options?: RequestInit): Promise<unknown> {
  const url = resolveGraphUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = toGraphServerError(res, body);
    logGraphFailure(path, err);
    throw err;
  }

  if (res.status === 204) return null;

  return res.json();
}

export async function graphFetchBuffer(accessToken: string, path: string, options?: RequestInit): Promise<ArrayBuffer> {
  const url = resolveGraphUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = toGraphServerError(res, body);
    logGraphFailure(path, err);
    throw err;
  }

  return res.arrayBuffer();
}
