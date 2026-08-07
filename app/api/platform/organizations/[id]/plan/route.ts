import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformOwner, forbidden, serverError, logServerError, badRequest, notFound } from "@/lib/server/api";
import { grantPlan } from "@/lib/server/tenant";
import { PLAN_CODES } from "@/lib/entitlements";
export const dynamic = "force-dynamic";

/**
 * Platform Owner — manual plan control (no payment required).
 *
 * Sets an organization to Trial / Starter / Professional / Enterprise with any
 * allowed source (TRIAL, MANUAL, SALES, DEMO, PARTNER, BILLING, INTERNAL).
 * Every change is written to SubscriptionChange (changed-by, previous/new
 * plan, source/reason, timestamp) — the access audit trail.
 *
 * Entitlements unlock immediately because lib/entitlements.ts derives feature
 * access from the subscription's planCode at request time.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Verified Entra tid === AOT_PLATFORM_TENANT_ID (centralized server-side guard).
  const owner = await requirePlatformOwner();
  if (!owner) return forbidden();
  const user = owner.user;

  const { id } = await params;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      planCode?: string;
      status?: string;
      source?: string;
      reason?: string;
      notes?: string;
      grantDays?: number;
    };

    if (!body.planCode || !PLAN_CODES.includes(body.planCode as (typeof PLAN_CODES)[number])) {
      return badRequest("Invalid plan. Choose Trial, Starter, Professional or Enterprise.");
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return notFound("Organization not found");

    const grantDays =
      body.grantDays !== undefined && Number.isFinite(Number(body.grantDays))
        ? Math.max(1, Math.min(3650, Math.round(Number(body.grantDays))))
        : undefined;

    const result = await grantPlan(org.id, {
      planCode: body.planCode,
      status: body.status,
      source: body.source,
      reason: body.reason,
      notes: body.notes,
      grantDays,
      grantedByUserId: user.id,
    });

    return NextResponse.json({
      data: {
        organizationId: org.id,
        ...result,
        planCode: body.planCode,
        status: body.status ?? (body.planCode === "TRIAL" ? "TRIALING" : "ACTIVE"),
        source: body.source ?? "MANUAL",
      },
    });
  } catch (err) {
    logServerError(`POST /api/platform/organizations/${id}/plan`, err);
    return serverError("Failed to update plan");
  }
}
