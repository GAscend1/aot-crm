import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { User } from "@/generated/prisma/client";
import { PLAN_LABELS } from "@/lib/entitlements";
import { isAotPlatformTenantConfigured, isAotPlatformTenantId } from "./platform-tenant";

/** The seeded legacy/single-tenant workspace every existing row belongs to. */
export const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Configurable trial length (days). Default 7 (full-feature evaluation); the
 * env override remains supported for testing/manual extensions.
 */
export const TRIAL_DURATION_DAYS = Math.max(
  1,
  Number(process.env.TRIAL_DURATION_DAYS || 7),
);

export const SUBSCRIPTION_STATUSES = [
  "TRIALING",
  "ACTIVE",
  "EXPIRED",
  "SUSPENDED",
  "CANCELED",
] as const;

export const SUBSCRIPTION_SOURCES = [
  "TRIAL",
  "MANUAL",
  "SALES",
  "DEMO",
  "PARTNER",
  "BILLING",
  "INTERNAL",
] as const;

export class SubscriptionBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionBlockedError";
  }
}

/**
 * Centralized Platform Owner check (server-side authorization).
 *
 * PRIMARY rule — the verified Microsoft Entra tenant id (tid) captured from the
 * authenticated session must equal `AOT_PLATFORM_TENANT_ID`:
 *
 *   tid === AOT_PLATFORM_TENANT_ID  →  isPlatformOwner = true
 *   otherwise                        →  isPlatformOwner = false
 *
 * The tid comes from the id_token (see auth.ts jwt callback) and is NEVER taken
 * from the browser. A customer tenant's Entra admin has a different tid and is
 * therefore NEVER a Platform Owner. Email domains/suffixes, localStorage,
 * client state and URL parameters are never consulted.
 *
 * Compatibility fallback (only when `AOT_PLATFORM_TENANT_ID` is NOT configured):
 * the SUPER_ADMIN role, then the DEPRECATED `PLATFORM_OWNER_EMAILS` allowlist.
 * The two systems never compete — the email path is ignored once the platform
 * tenant id is configured.
 */
export function isPlatformOwner(
  user: Pick<User, "email" | "role">,
  tenantId?: string | null,
): boolean {
  // PRIMARY — authenticated tenant id match.
  if (isAotPlatformTenantConfigured()) {
    return isAotPlatformTenantId(tenantId);
  }

  // Transitional fallback — no AOT_PLATFORM_TENANT_ID configured yet.
  if (user.role === "SUPER_ADMIN") return true;
  const owners = (process.env.PLATFORM_OWNER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return owners.length > 0 && owners.includes((user.email || "").toLowerCase());
}

export interface ResolvedOrg {
  userId: string;
  organizationId: string;
  email: string;
  tenantId: string | null;
  isNewOrganization: boolean;
}

/**
 * Resolves the caller's Organization from the authenticated Microsoft tenant
 * ID (tid) and auto-provisions an Organization + Owner membership + automatic
 * 7-day full-feature Trial on first login.
 *
 * - tenantId known → org keyed by microsoftTenantId (create if missing).
 * - tenantId unknown (legacy sessions) → the user's existing org, or the
 *   default AOT workspace for brand-new legacy users.
 *
 * NEVER uses the email domain as the security boundary.
 */
export async function resolveOrganizationForSession(): Promise<ResolvedOrg> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("AUTH_REQUIRED");

  const tenantId = session.user?.tenantId || null;

  // Existing user keeps their org (sticky) — avoids accidental data moves when
  // a user authenticates from a different tenant than their original signup.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, organizationId: true },
  });
  if (existing) {
    return {
      userId: existing.id,
      organizationId: existing.organizationId,
      email,
      tenantId,
      isNewOrganization: false,
    };
  }

  // New user: resolve/create the tenant-keyed organization.
  let org = tenantId
    ? await prisma.organization.findUnique({ where: { microsoftTenantId: tenantId } })
    : null;

  let isNewOrganization = false;
  if (!org) {
    const displayName = session.user?.name || email.split("@")[0] || "New workspace";
    org = await prisma.organization.create({
      data: {
        name: `${displayName}'s Workspace`,
        microsoftTenantId: tenantId,
        slug: undefined, // optional; avoid collisions
        status: "ACTIVE",
      },
    });
    isNewOrganization = true;
    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        planCode: "TRIAL",
        status: "TRIALING",
        source: "TRIAL",
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_DAYS * 86_400_000),
      },
    });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      organizationId: org.id,
      name: session.user?.name ?? undefined,
      image: session.user?.image ?? undefined,
      lastLogin: new Date(),
    },
    create: {
      email,
      name: session.user?.name,
      image: session.user?.image,
      organizationId: org.id,
      lastLogin: new Date(),
    },
  });

  // Idempotent owner membership (first member of a tenant-keyed org is its owner).
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: {},
    create: { organizationId: org.id, userId: user.id, role: "OWNER" },
  });

  return {
    userId: user.id,
    organizationId: org.id,
    email,
    tenantId,
    isNewOrganization,
  };
}

export interface SubscriptionInfo {
  planCode: string;
  status: string;
  source: string;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  startsAt: Date | null;
  endsAt: Date | null;
  /** True while TRIALING and the trial window has not elapsed. */
  trialActive: boolean;
  /** True when the workspace is usable (not EXPIRED / SUSPENDED / CANCELED). */
  active: boolean;
  /** Days remaining in the trial (>= 0). */
  trialDaysRemaining: number | null;
}

/**
 * Returns the organization's subscription, lazily flipping an elapsed trial to
 * EXPIRED (trial expiry must never delete data — it only gates writes).
 */
export async function getSubscription(organizationId: string): Promise<SubscriptionInfo | null> {
  const sub = await prisma.subscription.findUnique({ where: { organizationId } });
  if (!sub) return null;

  let status = sub.status;
  if (status === "TRIALING" && sub.trialEndsAt && sub.trialEndsAt < new Date()) {
    status = "EXPIRED";
    await prisma.subscription
      .update({ where: { id: sub.id }, data: { status } })
      .catch(() => {});
  }

  const trialActive = status === "TRIALING" && !!sub.trialEndsAt && sub.trialEndsAt >= new Date();
  const active = status === "TRIALING" || status === "ACTIVE";

  return {
    planCode: sub.planCode,
    status,
    source: sub.source,
    trialStartedAt: sub.trialStartedAt,
    trialEndsAt: sub.trialEndsAt,
    startsAt: sub.startsAt,
    endsAt: sub.endsAt,
    trialActive,
    active,
    trialDaysRemaining:
      status === "TRIALING" && sub.trialEndsAt
        ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86_400_000))
        : null,
  };
}

/**
 * Throws SubscriptionBlockedError when the workspace cannot accept writes
 * (expired trial or suspended/canceled subscription). Read-only access is
 * preserved — data is never deleted on trial expiry.
 */
export async function assertActiveSubscription(organizationId: string): Promise<SubscriptionInfo> {
  const info = await getSubscription(organizationId);
  if (!info) {
    throw new SubscriptionBlockedError("This workspace has no active subscription.");
  }
  if (!info.active) {
    throw new SubscriptionBlockedError(
      info.status === "SUSPENDED"
        ? "This workspace is suspended. Contact your administrator."
        : "Your trial has ended. Upgrade to keep editing — your data is safe.",
    );
  }
  return info;
}

/** Attach `organizationId` to a Prisma where clause (never trusts client input). */
export function orgWhere<T extends Record<string, unknown>>(
  organizationId: string,
  where: T = {} as T,
): T & { organizationId: string } {
  return { ...where, organizationId };
}

export interface PlanGrantInput {
  planCode: string;
  status?: string;
  source?: string;
  reason?: string;
  notes?: string;
  grantDays?: number;
  grantedByUserId: string;
}

/**
 * Platform Owner manual plan control: Trial / Starter / Professional /
 * Enterprise with no payment. Persists every change (changed-by, previous/new
 * plan, source/reason, timestamp) in SubscriptionChange — the access audit.
 */
export async function grantPlan(
  organizationId: string,
  input: PlanGrantInput,
): Promise<{ subscriptionId: string; previousPlan: string | null; previousStatus: string | null }> {
  const existing = await prisma.subscription.findUnique({ where: { organizationId } });

  const source = (input.source || "MANUAL") as string;
  const status = (input.status || "ACTIVE") as string;

  let trialStartedAt: Date | undefined;
  let trialEndsAt: Date | undefined;
  let startsAt: Date | undefined;
  let endsAt: Date | undefined;
  const now = new Date();

  if (status === "TRIALING" || input.planCode === "TRIAL") {
    trialStartedAt = now;
    trialEndsAt = new Date(now.getTime() + (input.grantDays || TRIAL_DURATION_DAYS) * 86_400_000);
  } else {
    startsAt = now;
    endsAt = input.grantDays ? new Date(now.getTime() + input.grantDays * 86_400_000) : undefined;
  }

  const previousPlan = existing?.planCode ?? null;
  const previousStatus = existing?.status ?? null;

  const subscription =
    existing ??
    (await prisma.subscription.create({
      data: { organizationId, planCode: "TRIAL", status: "TRIALING", source: "TRIAL" },
    }));

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      planCode: input.planCode,
      status,
      source,
      notes: input.notes ?? undefined,
      grantedById: input.grantedByUserId,
      trialStartedAt,
      trialEndsAt,
      startsAt,
      endsAt,
    },
  });

  await prisma.subscriptionChange.create({
    data: {
      subscriptionId: subscription.id,
      previousPlan,
      newPlan: input.planCode,
      previousStatus,
      newStatus: status,
      source,
      reason: input.reason ?? null,
      changedById: input.grantedByUserId,
    },
  });

  return { subscriptionId: subscription.id, previousPlan, previousStatus };
}

export function planLabel(planCode: string): string {
  return PLAN_LABELS[planCode as keyof typeof PLAN_LABELS] ?? planCode;
}
