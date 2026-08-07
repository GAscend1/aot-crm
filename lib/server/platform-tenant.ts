/**
 * AOT SaaS-owner tenant identification — AUTHORIZATION ONLY.
 *
 * This is deliberately a SEPARATE variable from the OAuth authority. The Entra
 * App Registration stays Microsoft organizational multi-tenant (`organizations`
 * authority); `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` remains unset/empty so any
 * work/school account can sign in. `AOT_PLATFORM_TENANT_ID` only identifies
 * which tenant's accounts get Platform Owner access to the /api/platform/*
 * endpoints and the Platform Owner administration section.
 *
 * Values are read at call time (not module load) so tests can vary them and
 * config changes never require a rebuild.
 */

/** True when the AOT platform tenant is configured in the environment. */
export function isAotPlatformTenantConfigured(): boolean {
  return !!((process.env.AOT_PLATFORM_TENANT_ID ?? "").trim());
}

/**
 * The verified Microsoft Entra tenant id (tid) of the authenticated session —
 * extracted from the id_token in the Auth.js jwt callback and carried on
 * `session.user.tenantId`. Never trust a tenant id sent from the browser.
 */
export function isAotPlatformTenantId(tenantId?: string | null): boolean {
  const configured = (process.env.AOT_PLATFORM_TENANT_ID ?? "").trim();
  if (!configured || !tenantId) return false;
  return tenantId.trim().toLowerCase() === configured.toLowerCase();
}
