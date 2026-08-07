import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformOwner, forbidden, serverError, logServerError, badRequest, notFound } from "@/lib/server/api";
import { grantPlan, TRIAL_DURATION_DAYS } from "@/lib/server/tenant";
import { PLAN_CODES } from "@/lib/entitlements";
export const dynamic = "force-dynamic";

const INQUIRY_STATUSES = [
  "PENDING",
  "REVIEWING",
  "LEAD",
  "CONVERTED",
  "RESOLVED",
  "REJECTED",
] as const;

/**
 * Platform Owner — review a sales inquiry. Actions:
 * - status: PENDING / REVIEWING / RESOLVED / REJECTED (keep pending, resolve, reject)
 * - grantTrial / grantDemo: create a Trial workspace (and optionally grant a
 *   demo plan) for the requester's organization, marking the inquiry LEAD/CONVERTED.
 *
 * An inquiry never auto-creates an Opportunity — converting to a Lead/CRM
 * record is a deliberate owner action elsewhere.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Verified Entra tid === AOT_PLATFORM_TENANT_ID (centralized server-side guard).
  const owner = await requirePlatformOwner();
  if (!owner) return forbidden();
  const user = owner.user;

  const { id } = await params;

  try {
    const inquiry = await prisma.salesInquiry.findUnique({ where: { id } });
    if (!inquiry) return notFound("Inquiry not found");

    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      notes?: string;
      grantTrial?: boolean;
      grantDemo?: string;
      grantDays?: number;
    };

    // ---- Grant Trial / Demo workspace ----
    if (body.grantTrial || (body.grantDemo && PLAN_CODES.includes(body.grantDemo as (typeof PLAN_CODES)[number]))) {
      const requestedPlan =
        body.grantDemo && PLAN_CODES.includes(body.grantDemo as (typeof PLAN_CODES)[number])
          ? (body.grantDemo as string)
          : "TRIAL";

      // Resolve/create the org by Microsoft tenant id first; fall back to the
      // inquiry email's matching user, else create a fresh workspace.
      let org = inquiry.organizationId
        ? await prisma.organization.findUnique({ where: { id: inquiry.organizationId } })
        : null;
      if (!org) {
        const existingUser = await prisma.user.findUnique({ where: { email: inquiry.email } });
        org = existingUser
          ? await prisma.organization.findUnique({ where: { id: existingUser.organizationId } })
          : null;
      }
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: `${inquiry.company || inquiry.name}'s Workspace`,
            status: "ACTIVE",
          },
        });
        await prisma.organizationMember.create({
          data: { organizationId: org.id, userId: user.id, role: "OWNER" },
        });
      }

      // Bind the requester to the granted workspace NOW (create the user row if
      // needed). resolveOrganizationForSession checks the user's existing org
      // first — without this, the requester's first sign-in would create a NEW
      // org with a fresh trial and never see the grant.
      const requester = await prisma.user.upsert({
        where: { email: inquiry.email },
        update: { organizationId: org.id },
        create: {
          email: inquiry.email,
          name: inquiry.name,
          organizationId: org.id,
        },
      });
      await prisma.organizationMember.upsert({
        where: {
          organizationId_userId: { organizationId: org.id, userId: requester.id },
        },
        update: { role: "MEMBER" },
        create: { organizationId: org.id, userId: requester.id, role: "MEMBER" },
      });

      await grantPlan(org.id, {
        planCode: requestedPlan,
        status: requestedPlan === "TRIAL" ? "TRIALING" : "ACTIVE",
        source: requestedPlan === "TRIAL" ? "TRIAL" : "DEMO",
        reason: `Inquiry ${inquiry.id} — ${requestedPlan} granted by ${user.email}`,
        notes: body.notes,
        grantDays:
          requestedPlan === "TRIAL"
            ? body.grantDays || TRIAL_DURATION_DAYS
            : undefined,
        grantedByUserId: user.id,
      });

      await prisma.salesInquiry.update({
        where: { id },
        data: {
          organizationId: org.id,
          status: "CONVERTED",
          reviewedById: user.id,
          reviewedAt: new Date(),
          notes: body.notes ?? `Granted ${requestedPlan} workspace ${org.id}`,
        },
      });

      return NextResponse.json({
        data: { id, organizationId: org.id, planCode: requestedPlan, status: "CONVERTED" },
      });
    }

    // ---- Status/notes only ----
    if (body.status && !INQUIRY_STATUSES.includes(body.status as (typeof INQUIRY_STATUSES)[number])) {
      return badRequest("Invalid inquiry status");
    }

    const updated = await prisma.salesInquiry.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
        reviewedById: body.status ? user.id : undefined,
        reviewedAt: body.status ? new Date() : undefined,
      },
    });

    return NextResponse.json({ data: { id: updated.id, status: updated.status } });
  } catch (err) {
    logServerError(`PATCH /api/platform/sales-inquiries/${id}`, err);
    return serverError("Failed to update inquiry");
  }
}
