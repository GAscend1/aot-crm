import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { ticketSchema } from "@/lib/validation/entities";
import { ticketToUI, uiTicketStatusToDb } from "../tickets/route";

export const dynamic = "force-dynamic";

/**
 * Help & Support submissions.
 *
 * Reuses the existing Tickets model (no second support architecture) but is a
 * dedicated endpoint for one deliberate reason: a customer whose trial has
 * expired or whose workspace is suspended must STILL be able to ask for help.
 * The general tickets POST keeps the subscription write gate; support does
 * not, because a support request is a help-channel write, not a plan-gated
 * feature write.
 *
 * Tenant isolation is enforced exactly like every other route:
 *  - the caller must be authenticated (getCrmUser);
 *  - organizationId is always derived server-side from the session — the
 *    client can never choose the organization;
 *  - the created ticket is scoped to that organization.
 * No email is sent — requests land in the workspace's Tickets list.
 */
export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = ticketSchema.parse(body);

    const data: Prisma.TicketCreateInput = {
      organization: { connect: { id: user.organizationId } },
      title: parsed.subject,
      description: parsed.description,
      priority: parsed.priority ?? "Medium",
      status: uiTicketStatusToDb(parsed.status ?? "Open"),
      sla: parsed.sla,
      requester: parsed.requester,
      department: parsed.department,
      comments: parsed.comments ?? 0,
      attachments: parsed.attachments ?? 0,
      assignee: parsed.assigneeId ? { connect: { id: parsed.assigneeId } } : undefined,
      customer: parsed.customerId ? { connect: { id: parsed.customerId } } : undefined,
    };
    const created = await prisma.ticket.create({ data, include: { assignee: true } });

    await logAudit({
      entityType: "ticket",
      entityId: created.id,
      action: "ticket.created",
      description: `Support request "${created.title}" submitted`,
      userId: user.id,
      organizationId: user.organizationId,
    });

    return NextResponse.json(ticketToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/support", err);
    return serverError("Failed to submit support request");
  }
}
