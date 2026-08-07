import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";
import type { Session } from "next-auth";
import { UserRole } from "@/config/roles";
import { resolveOrganizationForSession, assertActiveSubscription, getSubscription, isPlatformOwner } from "./tenant";
import { isAotPlatformTenantConfigured, isAotPlatformTenantId } from "./platform-tenant";
import { canUseFeature, featurePlanLabel } from "@/lib/entitlements";

export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function badRequest(message = "Invalid request"): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function serverError(message = "Internal server error"): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Structured, user-safe API error. Never includes internal details, secrets,
 * or database credentials — those are logged server-side separately.
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  fieldErrors: Record<string, string> = {}
): NextResponse {
  return NextResponse.json({ success: false, code, message, fieldErrors }, { status });
}

export interface ZodIssueLike {
  path?: (string | number)[];
  message: string;
}

/**
 * Converts a zod validation failure into a structured 400 response with
 * field-level errors the UI can display next to the offending inputs.
 */
export function zodValidationError(
  err: unknown,
  code = "VALIDATION_FAILED",
  fallbackMessage = "Invalid request data"
): NextResponse {
  const fieldErrors: Record<string, string> = {};
  if (err && typeof err === "object" && Array.isArray((err as { errors?: unknown }).errors)) {
    for (const issue of (err as { errors: ZodIssueLike[] }).errors) {
      const key = issue.path?.map(String).join(".") ?? "root";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
  }
  const message = Object.values(fieldErrors)[0] ?? fallbackMessage;
  return apiError(400, code, message, fieldErrors);
}

/** True when the thrown error is a Prisma unique-constraint violation (P2002). */
export function isUniqueConstraint(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
}

/** True when the thrown error is a Prisma "record not found" (P2025). */
export function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2025"
  );
}

export function logServerError(where: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`${where}:`, msg);
}

/**
 * Returns the signed-in CRM User record (created/updated on first login) or null.
 *
 * SaaS multi-tenancy: the user is resolved into an Organization keyed by the
 * authenticated Microsoft tenant id (tid). A brand-new user gets an isolated
 * Organization + automatic Trial automatically (never shared with other
 * tenants, never derived from the email domain). Legacy users keep their
 * existing organization (backfilled into the default workspace).
 */
export async function getCrmUser(): Promise<User | null> {
  const session = (await auth()) as Session | null;
  if (!session?.user?.email) return null;

  try {
    const ctx = await resolveOrganizationForSession();
    return await prisma.user.findUnique({ where: { id: ctx.userId } });
  } catch (err) {
    if (err instanceof Error && err.message === "AUTH_REQUIRED") return null;
    console.error("getCrmUser failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * The authenticated user with a guaranteed organizationId. All protected API
 * routes must use this (or getCrmUser + org checks) so tenant-owned queries
 * can be scoped server-side.
 */
/**
 * Platform Owner guard for server routes. Returns the CRM user + the verified
 * Microsoft tenant id when the caller is an AOT Platform Owner, otherwise null
 * (callers must return 403). Ownership is decided by the authenticated
 * session's verified Entra `tid` against `AOT_PLATFORM_TENANT_ID` — never by
 * email domain, client state, URL parameters, or browser-supplied ids.
 */
export async function requirePlatformOwner(): Promise<{
  user: User;
  tenantId: string | null;
} | null> {
  const session = (await auth()) as Session | null;
  const tenantId = session?.user?.tenantId ?? null;

  // Fail fast: when AOT_PLATFORM_TENANT_ID is configured, ownership is decided
  // by the verified tid alone — a non-matching tid skips the DB user lookup.
  if (isAotPlatformTenantConfigured() && !isAotPlatformTenantId(tenantId)) {
    return null;
  }

  const user = await getCrmUser();
  if (!user) return null;
  return isPlatformOwner(user, tenantId) ? { user, tenantId } : null;
}

export async function requireOrgUser(): Promise<User> {
  const user = await getCrmUser();
  if (!user) throw new UnauthorizedError();
  if (!user.organizationId) throw new UnauthorizedError("No organization assigned");
  return user;
}

export async function requireUser(): Promise<User> {
  return requireOrgUser();
}

export function hasRole(user: User, roles: UserRole[]): boolean {
  return roles.includes(user.role as UserRole);
}

export function isAdmin(user: User): boolean {
  return hasRole(user, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
}

export function isReportsManager(user: User): boolean {
  return hasRole(user, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER]);
}

/**
 * True for in-workspace admins (SUPER_ADMIN / ADMIN) OR verified AOT Platform
 * Owners. Platform Owners keep the workspace user-administration table working
 * even when their CRM workspace role is not ADMIN (e.g. VIEWER) — ownership is
 * decided by the authenticated Entra tid, never by the workspace role.
 */
export async function isAdminOrPlatformOwner(user: User): Promise<boolean> {
  if (isAdmin(user)) return true;
  const session = (await auth()) as Session | null;
  return isPlatformOwner(user, session?.user?.tenantId ?? null);
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Subscription write gate — call in mutating route handlers (POST/PATCH/
 * DELETE). Returns a NextResponse when the workspace is read-only (expired
 * trial, suspended/canceled subscription) and null when writes are allowed.
 * Reads are never blocked; trial expiry never deletes data.
 */
export async function subscriptionWriteGate(user: User): Promise<NextResponse | null> {
  try {
    await assertActiveSubscription(user.organizationId);
    return null;
  } catch (err) {
    if (err instanceof Error && err.name === "SubscriptionBlockedError") {
      return NextResponse.json(
        { error: err.message, code: "SUBSCRIPTION_BLOCKED" },
        { status: 403 },
      );
    }
    return serverError("Failed to check subscription status");
  }
}

/**
 * Feature entitlement gate — call in route handlers for plan-gated modules
 * (quotes, invoices, reports, advanced analytics, ...). Returns a NextResponse
 * when the plan does NOT grant the feature, and null when the caller is
 * entitled. The UI independently renders locked states via FeatureGate, but
 * enforcement lives here — never rely on hidden/disabled UI alone.
 *
 * Reads are gated too: a workspace calling GET /api/quotes without the plan
 * gets 403 rather than silently seeing quote data it cannot use.
 *
 * Platform Owner bypass: a verified AOT Platform Owner (session Entra tid ===
 * AOT_PLATFORM_TENANT_ID) is unrestricted by customer plan entitlements —
 * every implemented feature is allowed. This NEVER edits the customer's
 * Subscription row; it only widens access for the owner's own session. The
 * technical integration state (is the provider connected) is still enforced
 * by the integration routes themselves.
 */
export async function featureGate(user: User, feature: string): Promise<NextResponse | null> {
  const session = (await auth()) as Session | null;
  if (isPlatformOwner(user, session?.user?.tenantId ?? null)) return null;

  const subscription = await getSubscription(user.organizationId);
  if (!subscription) {
    return NextResponse.json(
      { error: "No subscription on this workspace", code: "FEATURE_NOT_ENTITLED" },
      { status: 403 },
    );
  }
  if (!canUseFeature(subscription.planCode, feature)) {
    const required = featurePlanLabel(feature);
    return NextResponse.json(
      {
        error: `This feature is not included in your ${subscription.planCode} plan.`,
        code: "FEATURE_NOT_ENTITLED",
        feature,
        requiredPlan: required,
      },
      { status: 403 },
    );
  }
  return null;
}
