/**
 * Microsoft Entra authority resolution.
 *
 * The Entra App Registration is configured for **multiple Entra ID tenants**
 * (work/school accounts from any organization). The default authority is
 * therefore `organizations` — NOT the original AOT/Ascend One tenant. This is
 * the only non-single-tenant organizational endpoint that excludes personal
 * Microsoft accounts (`common` would include those, `organizations` does not).
 *
 * Legacy single-tenant override: setting `AUTH_MICROSOFT_ENTRA_ID_SINGLE_TENANT=true`
 * (and keeping `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`) pins the authority back to
 * that one tenant. Without the explicit override, the tenant-ID env var is
 * ignored for the *login/refresh* endpoints so multi-tenant login is never
 * forced through the original tenant.
 */

export function msTenantSegment(): string {
  const singleTenant =
    process.env.AUTH_MICROSOFT_ENTRA_ID_SINGLE_TENANT === "true" &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;
  return singleTenant ? process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID! : "organizations";
}

/** e.g. https://login.microsoftonline.com/organizations */
export function msAuthority(): string {
  return `https://login.microsoftonline.com/${msTenantSegment()}`;
}

/** OpenID Connect issuer for the Auth.js provider. */
export function msIssuer(): string {
  return `${msAuthority()}/v2.0`;
}

/** OAuth2 token endpoint used for refresh-token exchange. */
export function msTokenUrl(): string {
  return `${msAuthority()}/oauth2/v2.0/token`;
}

/**
 * Extract the `tid` claim from an Entra id_token JWT payload (base64url, no
 * signature verification needed here — Auth.js already verified the token).
 * Returns null when the token is missing/malformed so callers can degrade
 * gracefully (e.g. legacy sessions that predate tenant persistence).
 */
export function extractTenantId(idToken?: string | null): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { tid?: unknown };
    return typeof decoded.tid === "string" && decoded.tid.length > 0 ? decoded.tid : null;
  } catch {
    return null;
  }
}
