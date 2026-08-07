import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { getSubscription, planLabel, isPlatformOwner } from "@/lib/server/tenant";
import { grantedFeatures, canUseFeature, PLAN_CODES, ALL_FEATURES } from "@/lib/entitlements";
export const dynamic = "force-dynamic";

/**
 * The signed-in user's Organization subscription + granted features.
 *
 * Used by the trial indicator ("Trial · 12 days left"), expired-trial
 * read-only gate, and every client-side entitlement check. Server routes use
 * getSubscription()/canUseFeature() directly — never trust this response alone.
 */
export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const info = await getSubscription(user.organizationId);

    // Display-only Platform Owner flag (authorization is server-side in
    // requirePlatformOwner / featureGate). Computed from the verified Entra
    // tenant id — never from the browser.
    const session = (await auth()) as Session | null;
    const platformOwner = isPlatformOwner(user, session?.user?.tenantId ?? null);

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, name: true, microsoftTenantId: true, createdAt: true },
    });

    // A verified AOT Platform Owner bypasses customer plan entitlements for
    // every implemented feature (server-side featureGate does the same). The
    // client subscription payload mirrors that so FeatureGate never locks the
    // owner's UI — WITHOUT mutating the organization's Subscription row.
    const effectivePlan = platformOwner ? "ENTERPRISE" : info?.planCode ?? "TRIAL";

    return NextResponse.json({
      data: {
        isPlatformOwner: platformOwner,
        organizationId: organization?.id ?? user.organizationId,
        organizationName: organization?.name ?? "My workspace",
        microsoftTenantId: organization?.microsoftTenantId ?? null,
        createdAt: organization?.createdAt.toISOString() ?? null,
        planCode: info?.planCode ?? "TRIAL",
        planLabel: planLabel(info?.planCode ?? "TRIAL"),
        status: info?.status ?? "TRIALING",
        source: info?.source ?? "TRIAL",
        trialActive: info?.trialActive ?? false,
        active: info?.active ?? false,
        trialStartedAt: info?.trialStartedAt?.toISOString() ?? null,
        trialEndsAt: info?.trialEndsAt?.toISOString() ?? null,
        trialDaysRemaining: info?.trialDaysRemaining ?? null,
        // Entitlement fast-path for the UI (server still re-checks each feature).
        features: grantedFeatures(effectivePlan),
        canUse: Object.fromEntries(
          ALL_FEATURES.map((feature) => [feature, canUseFeature(effectivePlan, feature)]),
        ),
        plans: PLAN_CODES,
      },
    });
  } catch (err) {
    logServerError("GET /api/billing/subscription", err);
    return serverError("Failed to fetch subscription");
  }
}
