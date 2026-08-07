import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformOwner, forbidden, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

export interface UISubscriptionChange {
  id: string;
  organizationId: string;
  organizationName: string;
  previousPlan: string | null;
  newPlan: string;
  previousStatus: string | null;
  newStatus: string | null;
  source: string | null;
  reason: string | null;
  changedByName: string | null;
  changedByEmail: string | null;
  createdAt: string;
}

/**
 * Platform Owner — access audit history. Every manual plan override, trial
 * extension/expiry and suspend/reactivate writes a SubscriptionChange row with
 * changed-by, previous/new plan, source/reason and timestamp.
 */
export async function GET(request: NextRequest) {
  // Verified Entra tid === AOT_PLATFORM_TENANT_ID (centralized server-side guard).
  const owner = await requirePlatformOwner();
  if (!owner) return forbidden();

  const limit = Math.min(
    500,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") || 200)),
  );

  try {
    const changes = await prisma.subscriptionChange.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        subscription: {
          select: {
            organizationId: true,
            organization: { select: { name: true } },
          },
        },
        changedBy: { select: { name: true, email: true } },
      },
    });

    const data: UISubscriptionChange[] = changes.map((c) => ({
      id: c.id,
      organizationId: c.subscription.organizationId,
      organizationName: c.subscription.organization.name,
      previousPlan: c.previousPlan,
      newPlan: c.newPlan,
      previousStatus: c.previousStatus,
      newStatus: c.newStatus,
      source: c.source,
      reason: c.reason,
      changedByName: c.changedBy?.name ?? null,
      changedByEmail: c.changedBy?.email ?? null,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ data, total: data.length });
  } catch (err) {
    logServerError("GET /api/platform/subscription-changes", err);
    return serverError("Failed to fetch subscription changes");
  }
}
