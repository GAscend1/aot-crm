/**
 * Deployment base-URL and cookie-policy resolution (server-only).
 *
 * Single source of truth for the public app origin and for the Auth.js secure
 * cookie policy. Every module that needs the public origin or needs to read the
 * Auth.js session cookie should use these helpers instead of re-implementing
 * the AUTH_URL > NEXTAUTH_URL precedence chain.
 */

/** Auth.js v5 base URL: AUTH_URL, falling back to the legacy NEXTAUTH_URL alias. */
export function authBaseUrl(): string | undefined {
  return process.env.AUTH_URL || process.env.NEXTAUTH_URL || undefined;
}

/**
 * Public app origin used for cross-origin checks and callback/notification URL
 * construction. Precedence: AUTH_URL (Auth.js v5) > NEXTAUTH_URL (legacy) >
 * Vercel > Azure App Service hostname > localhost dev default.
 */
export function appOrigin(): string {
  const url = authBaseUrl();
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.WEBSITE_HOSTNAME) return `https://${process.env.WEBSITE_HOSTNAME}`;
  return "http://localhost:3000";
}

/**
 * Whether Auth.js should use secure cookies (the `__Secure-`/`__Host-` prefix
 * names). Must be true in production HTTPS so cookie names are stable across
 * the whole OAuth flow. Auth.js otherwise derives the policy per request from
 * the observed scheme (x-forwarded-proto); fixing it here makes it deterministic
 * behind the App Service regardless of how individual requests observe the
 * scheme, so the PKCE verifier / state cookies always match on the callback.
 *
 * NOTE: `__Secure-`/`__Host-` cookies are rejected by browsers when set over
 * plain HTTP, so "HTTPS Only" must be enabled on the App Service.
 */
export function secureCookiesEnabled(): boolean {
  const url = authBaseUrl();
  if (url) return url.startsWith("https://");
  return process.env.NODE_ENV === "production";
}
