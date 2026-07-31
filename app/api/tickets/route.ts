import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, TicketStatus, TicketPriority } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { ticketSchema } from "@/lib/validation/entities";

export type UITicket = {
  id: string; subject: string; description: string; priority: string;
  status: string; sla: string; assignee: string; requester: string;
  department: string; comments: number; attachments: number;
  createdAt: string; updatedAt: string;
};

const UI_STATUS_TO_DB: Record<string, string> = {
  Open: "Open",
  "In Progress": "InProgress",
  Resolved: "Resolved",
  Closed: "Closed",
};

const DB_STATUS_TO_UI: Record<string, string> = {
  Open: "Open",
  InProgress: "In Progress",
  Resolved: "Resolved",
  Closed: "Closed",
};

export function uiTicketStatusToDb(status: string): TicketStatus {
  return (UI_STATUS_TO_DB[status] ?? "Open") as TicketStatus;
}

export function dbTicketStatusToUi(status: string): string {
  return DB_STATUS_TO_UI[status] ?? status;
}

export function ticketToUI(c: Prisma.TicketGetPayload<{ include: { assignee: true } }>): UITicket {
  return {
    id: c.id,
    subject: c.title,
    description: c.description ?? "",
    priority: c.priority,
    status: dbTicketStatusToUi(c.status),
    sla: c.sla ?? "",
    assignee: c.assignee?.name ?? "",
    requester: c.requester ?? "",
    department: c.department ?? "",
    comments: c.comments,
    attachments: c.attachments,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")));
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";
  const search = searchParams.get("search") ?? "";
  const filters = searchParams.get("filters");

  const where: Prisma.TicketWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (filters) {
    try {
      const parsed = JSON.parse(filters) as Record<string, unknown>;
      if (parsed.status) where.status = uiTicketStatusToDb(String(parsed.status));
      if (parsed.priority) where.priority = parsed.priority as TicketPriority;
    } catch { /* ignore invalid JSON */ }
  }

  const orderBy: Prisma.TicketOrderByWithRelationInput = {};
  if (sortBy === "assignee") orderBy.assignee = { name: sortOrder };
  else if (sortBy === "subject") orderBy.title = sortOrder;
  else (orderBy as Record<string, string>)[sortBy] = sortOrder;

  try {
    const [data, total] = await Promise.all([
      prisma.ticket.findMany({ where, include: { assignee: true }, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.ticket.count({ where }),
    ]);
    return NextResponse.json({ data: data.map(ticketToUI), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    logServerError("GET /api/tickets", err);
    return serverError("Failed to fetch tickets");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = ticketSchema.parse(body);

    const data: Prisma.TicketCreateInput = {
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
      description: `Ticket "${created.title}" created`,
      userId: user.id,
    });

    return NextResponse.json(ticketToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/tickets", err);
    return serverError("Failed to create ticket");
  }
}
