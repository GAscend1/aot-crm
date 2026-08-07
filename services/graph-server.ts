import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { msTokenUrl } from "@/lib/server/ms-auth";

export class GraphServerError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "GraphServerError";
    this.status = status;
    this.code = code;
  }
}

export async function getGraphToken(req?: NextRequest): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  const token = await getToken({ req: req as never, secret });
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
  const url = `https://graph.microsoft.com/v1.0${path}`;
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
    const graphMessage = body.error?.message;
    const safeMessage = graphMessage
      ? graphMessage.replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
                     .replace(/access_token[^&\s]+/gi, "access_token=[redacted]")
      : `Graph API returned status ${res.status}`;

    throw new GraphServerError(
      safeMessage,
      res.status,
      body.error?.code,
    );
  }

  if (res.status === 204) return null;

  return res.json();
}

export async function graphFetchBuffer(accessToken: string, path: string, options?: RequestInit): Promise<ArrayBuffer> {
  const url = `https://graph.microsoft.com/v1.0${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const graphMessage = body.error?.message;
    const safeMessage = graphMessage
      ? graphMessage.replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
                     .replace(/access_token[^&\s]+/gi, "access_token=[redacted]")
      : `Graph API returned status ${res.status}`;

    throw new GraphServerError(
      safeMessage,
      res.status,
      body.error?.code,
    );
  }

  return res.arrayBuffer();
}
