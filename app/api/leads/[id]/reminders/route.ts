import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit, createActivity, leadDisplayName } from "@/lib/server/records";
import { reminderSchema } from "@/lib/validation/entities";
export const dynamic = "force-dynamic";

export type LeadReminder = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const lead = await prisma.lead.findFirst({ where: { id, organizationId: user.organizationId }, select: { id: true } });
    if (!lead) return notFound("Lead not found");
    const reminders = await prisma.reminder.findMany({
      where: { leadId: id, organizationId: user.organizationId },
      orderBy: { dueDate: "asc" },
    });
    const data: LeadReminder[] = reminders.map((r) => ({
      id: r.id,
      title: r.title,
      dueDate: r.dueDate.toISOString(),
      completed: r.completed,
    }));
    return NextResponse.json({ data });
  } catch (err) {
    logServerError(`GET /api/leads/${id}/reminders`, err);
    return serverError("Failed to fetch reminders");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const lead = await prisma.lead.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!lead) return notFound("Lead not found");
    const body = await request.json().catch(() => ({}));
    const parsed = reminderSchema.parse(body);
    const reminder = await prisma.reminder.create({
      data: {
        title: parsed.title,
        dueDate: new Date(parsed.dueDate),
        userId: user.id,
        organizationId: user.organizationId,
        leadId: id,
        entityType: "lead",
        entityId: id,
      },
    });
    await logAudit({
      entityType: "lead",
      entityId: id,
      action: "lead.reminder_created",
      description: `Reminder "${reminder.title}" added to lead "${leadDisplayName(lead)}"`,
      userId: user.id,
      organizationId: user.organizationId,
      data: { reminderId: reminder.id, dueDate: reminder.dueDate.toISOString() },
    });
    await createActivity({
      type: "Task",
      subject: reminder.title,
      description: `Reminder for ${leadDisplayName(lead)}`,
      status: "Planned",
      dueDate: reminder.dueDate,
      leadId: id,
      organizationId: user.organizationId,
    });
    return NextResponse.json(
      {
        data: {
          id: reminder.id,
          title: reminder.title,
          dueDate: reminder.dueDate.toISOString(),
          completed: reminder.completed,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logServerError(`POST /api/leads/${id}/reminders`, err);
    return serverError("Failed to create reminder");
  }
}
