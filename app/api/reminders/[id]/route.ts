import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { reminderSchema } from "@/lib/validation/entities";
import { reminderToUI } from "../route";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = reminderSchema.partial().parse(body);
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) return notFound("Reminder not found");
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "You can only update your own reminders" }, { status: 403 });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        title: parsed.title ?? existing.title,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : existing.dueDate,
        completed: parsed.completed ?? existing.completed,
      },
    });

    await logAudit({
      entityType: "reminder",
      entityId: id,
      action: "reminder.updated",
      description: `Reminder "${updated.title}" ${updated.completed ? "completed" : "updated"}`,
      userId: user.id,
      after: { completed: updated.completed },
    });

    return NextResponse.json({ data: reminderToUI(updated) });
  } catch (err) {
    logServerError(`PATCH /api/reminders/${id}`, err);
    return serverError("Failed to update reminder");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) return notFound("Reminder not found");
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "You can only delete your own reminders" }, { status: 403 });
    }
    await prisma.reminder.delete({ where: { id } });
    await logAudit({
      entityType: "reminder",
      entityId: id,
      action: "reminder.deleted",
      description: `Reminder "${existing.title}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/reminders/${id}`, err);
    return serverError("Failed to delete reminder");
  }
}
