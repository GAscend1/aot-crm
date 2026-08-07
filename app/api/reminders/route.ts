import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { reminderSchema } from "@/lib/validation/entities";
import type { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

export type UIReminder = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  leadId: string | null;
  entityType: string | null;
  entityId: string | null;
};

export function reminderToUI(c: Prisma.ReminderGetPayload<Record<string, never>>): UIReminder {
  return {
    id: c.id,
    title: c.title,
    dueDate: c.dueDate.toISOString(),
    completed: c.completed,
    leadId: c.leadId,
    entityType: c.entityType,
    entityId: c.entityId,
  };
}

export async function GET(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const where: Prisma.ReminderWhereInput = { userId: user.id, organizationId: user.organizationId };
  if (leadId) where.leadId = leadId;
  try {
    const data = await prisma.reminder.findMany({
      where,
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json({ data: data.map(reminderToUI) });
  } catch (err) {
    logServerError("GET /api/reminders", err);
    return serverError("Failed to fetch reminders");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = reminderSchema.parse(body);
    const created = await prisma.reminder.create({
      data: {
        title: parsed.title,
        dueDate: new Date(parsed.dueDate),
        userId: user.id,
        organizationId: user.organizationId,
        leadId: parsed.leadId || undefined,
        entityType: parsed.entityType || undefined,
        entityId: parsed.entityId || undefined,
      },
    });
    await logAudit({
      entityType: parsed.entityType || "reminder",
      entityId: parsed.entityId || created.id,
      action: "reminder.created",
      description: `Reminder "${created.title}" created`,
      userId: user.id,
      organizationId: user.organizationId,
      data: { reminderId: created.id, dueDate: created.dueDate.toISOString() },
    });
    return NextResponse.json({ data: reminderToUI(created) }, { status: 201 });
  } catch (err) {
    logServerError("POST /api/reminders", err);
    return serverError("Failed to create reminder");
  }
}
