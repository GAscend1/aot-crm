import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit, createActivity, createNotification, leadDisplayName } from "@/lib/server/records";
import { leadAssignSchema } from "@/lib/validation/entities";
import { leadToUI } from "../../route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = leadAssignSchema.parse(body);
    const lead = await prisma.lead.findUnique({ where: { id }, include: { assignedTo: true } });
    if (!lead) return notFound("Lead not found");

    let assigneeId = parsed.assigneeId ?? null;
    if (parsed.assignToSelf) assigneeId = user.id;
    if (assigneeId === (lead.assignedToId ?? "")) {
      return NextResponse.json(leadToUI(lead));
    }

    if (assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 400 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: assigneeId ? { assignedTo: { connect: { id: assigneeId } } } : { assignedTo: { disconnect: true } },
      include: { assignedTo: true },
    });

    const beforeOwner = lead.assignedTo?.name ?? "Unassigned";
    const afterOwner = updated.assignedTo?.name ?? "Unassigned";
    const desc = `Owner changed from "${beforeOwner}" to "${afterOwner}"`;

    await logAudit({
      entityType: "lead",
      entityId: id,
      action: "lead.assigned",
      description: desc,
      userId: user.id,
      before: { assignedToId: lead.assignedToId },
      after: { assignedToId: updated.assignedToId },
    });
    await createActivity({
      type: "Task",
      subject: `Lead assigned to ${afterOwner}`,
      description: desc,
      status: "Completed",
      leadId: id,
      assigneeId: updated.assignedToId,
    });
    if (updated.assignedToId && updated.assignedToId !== user.id) {
      await createNotification({
        userId: updated.assignedToId,
        type: "Info",
        title: "Lead assigned to you",
        message: `Lead "${leadDisplayName(lead)}" was assigned to you by ${user.name ?? user.email}`,
        entityType: "lead",
        entityId: id,
        actionLink: `/leads/${id}`,
      });
    }

    return NextResponse.json(leadToUI(updated));
  } catch (err) {
    logServerError(`POST /api/leads/${id}/assign`, err);
    return serverError("Failed to assign lead");
  }
}
