import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, TicketPriority } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { ticketSchema } from "@/lib/validation/entities";
import { ticketToUI, uiTicketStatusToDb } from "../route";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id }, include: { assignee: true } });
    if (!ticket) return notFound("Ticket not found");
    return NextResponse.json(ticketToUI(ticket));
  } catch (err) {
    logServerError(`GET /api/tickets/${id}`, err);
    return serverError("Failed to fetch ticket");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = ticketSchema.partial().parse(body);
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) return notFound("Ticket not found");

    const data: Prisma.TicketUpdateInput = {};
    if (parsed.subject !== undefined) data.title = parsed.subject;
    if (parsed.description !== undefined) data.description = parsed.description || null;
    if (parsed.priority !== undefined) data.priority = parsed.priority as TicketPriority;
    if (parsed.status !== undefined) data.status = uiTicketStatusToDb(parsed.status);
    if (parsed.sla !== undefined) data.sla = parsed.sla || null;
    if (parsed.requester !== undefined) data.requester = parsed.requester || null;
    if (parsed.department !== undefined) data.department = parsed.department || null;
    if (parsed.comments !== undefined) data.comments = parsed.comments;
    if (parsed.attachments !== undefined) data.attachments = parsed.attachments;
    if (parsed.assigneeId !== undefined) {
      data.assignee = parsed.assigneeId ? { connect: { id: parsed.assigneeId } } : { disconnect: true };
    }
    if (parsed.customerId !== undefined) {
      data.customer = parsed.customerId ? { connect: { id: parsed.customerId } } : { disconnect: true };
    }

    const updated = await prisma.ticket.update({ where: { id }, data, include: { assignee: true } });

    await logAudit({
      entityType: "ticket",
      entityId: id,
      action: "ticket.updated",
      description: `Ticket "${updated.title}" updated`,
      userId: user.id,
    });

    return NextResponse.json(ticketToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/tickets/${id}`, err);
    return serverError("Failed to update ticket");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) return notFound("Ticket not found");
    await prisma.ticket.delete({ where: { id } });
    await logAudit({
      entityType: "ticket",
      entityId: id,
      action: "ticket.deleted",
      description: `Ticket "${existing.title}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/tickets/${id}`, err);
    return serverError("Failed to delete ticket");
  }
}
