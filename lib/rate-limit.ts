import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULTS: Record<string, { limit: number; windowMs: number }> = {
  "mail:send": { limit: 30, windowMs: 60_000 },
  "mail:draft": { limit: 60, windowMs: 60_000 },
  "mail:reply": { limit: 30, windowMs: 60_000 },
  "mail:replyAll": { limit: 30, windowMs: 60_000 },
  "mail:forward": { limit: 30, windowMs: 60_000 },
  "calendar:create": { limit: 30, windowMs: 60_000 },
  "calendar:update": { limit: 60, windowMs: 60_000 },
  "calendar:delete": { limit: 60, windowMs: 60_000 },
};

export function getRateLimitConfig(action: string): { limit: number; windowMs: number } {
  return DEFAULTS[action] ?? { limit: 30, windowMs: DEFAULT_WINDOW_MS };
}

export function checkRateLimit(
  action: string,
  userId: string,
  limitOverride?: number,
  windowOverride?: number,
): { allowed: boolean; remaining: number; resetAt: number; retryAfter: number } {
  const config = getRateLimitConfig(action);
  const limit = limitOverride ?? config.limit;
  const windowMs = windowOverride ?? config.windowMs;

  if (limit <= 0) {
    return { allowed: false, remaining: 0, resetAt: 0, retryAfter: windowMs / 1000 };
  }

  let actionStore = stores.get(action);
  if (!actionStore) {
    actionStore = new Map();
    stores.set(action, actionStore);
  }

  const now = Date.now();
  const entry = actionStore.get(userId);

  if (!entry || now >= entry.resetAt) {
    actionStore.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt, retryAfter: 0 };
}

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: `Rate limit exceeded. Try again in ${retryAfter} seconds.` },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + retryAfter),
      },
    },
  );
}

export function clearRateLimits(): void {
  stores.clear();
}
