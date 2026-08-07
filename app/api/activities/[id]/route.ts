import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { activitySchema } from "@/lib/validation/entities";
import type { Prisma } from "@/generated/prisma/client";
import { activityToUI } from "../route";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const activity = await prisma.activity.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { assignee: true },
    });
    if (!activity) return notFound("Activity not found");
    return NextResponse.json(activityToUI(activity));
  } catch (err) {
    logServerError(`GET /api/activities/${id}`, err);
    return serverError("Failed to fetch activity");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = activitySchema.partial().parse(body);
    const existing = await prisma.activity.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return notFound("Activity not found");

    const data: Prisma.ActivityUpdateInput = {};
    if (parsed.type !== undefined) data.type = parsed.type;
    if (parsed.subject !== undefined) data.subject = parsed.subject;
    if (parsed.description !== undefined) data.description = parsed.description || null;
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.priority !== undefined) data.priority = parsed.priority;
    if (parsed.dueDate !== undefined) {
      data.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
    }
    if (parsed.completed !== undefined && parsed.completed) {
      data.status = "Completed";
      data.completedAt = new Date();
    }
    if (parsed.assigneeId !== undefined) {
      data.assignee = parsed.assigneeId ? { connect: { id: parsed.assigneeId } } : { disconnect: true };
    }
    if (parsed.companyId !== undefined) {
      data.company = parsed.companyId ? { connect: { id: parsed.companyId } } : { disconnect: true };
    }

    const updated = await prisma.activity.update({
      where: { id },
      data,
      include: { assignee: true },
    });

    await logAudit({
      entityType: "activity",
      entityId: id,
      action: "activity.updated",
      description: `Activity "${updated.subject}" updated`,
      userId: user.id,
      after: { status: updated.status },
    });

    return NextResponse.json(activityToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/activities/${id}`, err);
    return serverError("Failed to update activity");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const existing = await prisma.activity.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return notFound("Activity not found");
    await prisma.activity.delete({ where: { id } });
    await logAudit({
      entityType: "activity",
      entityId: id,
      action: "activity.deleted",
      description: `Activity "${existing.subject}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/activities/${id}`, err);
    return serverError("Failed to delete activity");
  }
}
