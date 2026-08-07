/**
 * Client-side fetch + query-string helpers (pure, unit-testable).
 * Centralizes how data hooks build URLs so every consumer dedupes against
 * the same cache keys.
 */

export type QueryValue = string | number | boolean | null | undefined;

/** Build a query string, skipping empty/undefined values. */
export function buildQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Fetch a JSON API route with optional query params. Throws on non-2xx. */
export async function fetchJson<T>(
  path: string,
  params?: Record<string, QueryValue>,
  init?: RequestInit,
): Promise<T> {
  const url = `${path}${buildQueryString(params ?? {})}`;
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}
