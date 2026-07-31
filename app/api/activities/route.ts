import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { activitySchema } from "@/lib/validation/entities";
import type { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

export type UIActivity = {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  time: string;
  owner: string;
  status: string;
  relatedTo: string;
  relatedType: string;
  reminder: string;
  createdAt: string;
  updatedAt: string;
};

export function activityToUI(
  c: Prisma.ActivityGetPayload<{ include: { assignee: true } }>
): UIActivity {
  return {
    id: c.id,
    type: c.type,
    subject: c.subject,
    description: c.description ?? "",
    date: c.dueDate?.toISOString().split("T")[0] ?? "",
    time: c.dueDate?.toISOString().split("T")[1]?.substring(0, 5) ?? "",
    owner: c.assignee?.name ?? "",
    status: c.status,
    relatedTo: c.leadId ?? c.opportunityId ?? c.customerId ?? c.ticketId ?? "",
    relatedType: c.leadId
      ? "lead"
      : c.opportunityId
        ? "opportunity"
        : c.customerId
          ? "customer"
          : c.ticketId
            ? "ticket"
            : "",
    reminder: "",
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

  const where: Prisma.ActivityWhereInput = {};
  const leadId = searchParams.get("leadId");
  const opportunityId = searchParams.get("opportunityId");
  const customerId = searchParams.get("customerId");
  const ticketId = searchParams.get("ticketId");
  if (leadId) where.leadId = leadId;
  if (opportunityId) where.opportunityId = opportunityId;
  if (customerId) where.customerId = customerId;
  if (ticketId) where.ticketId = ticketId;

  const orderBy: Prisma.ActivityOrderByWithRelationInput = {};
  if (sortBy === "owner") orderBy.assignee = { name: sortOrder };
  else (orderBy as Record<string, string>)[sortBy] = sortOrder;

  try {
    const [data, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: { assignee: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activity.count({ where }),
    ]);
    return NextResponse.json({
      data: data.map(activityToUI),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    logServerError("GET /api/activities", err);
    return serverError("Failed to fetch activities");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = activitySchema.parse(body);
    const dueDate = parsed.dueDate ? new Date(parsed.dueDate) : undefined;

    const data: Prisma.ActivityCreateInput = {
      type: parsed.type,
      subject: parsed.subject,
      description: parsed.description || undefined,
      status: parsed.status,
      priority: parsed.priority,
      dueDate,
      assignee: parsed.assigneeId ? { connect: { id: parsed.assigneeId } } : undefined,
      lead: parsed.leadId ? { connect: { id: parsed.leadId } } : undefined,
      opportunity: parsed.opportunityId ? { connect: { id: parsed.opportunityId } } : undefined,
      customer: parsed.customerId ? { connect: { id: parsed.customerId } } : undefined,
      ticket: parsed.ticketId ? { connect: { id: parsed.ticketId } } : undefined,
    };

    const created = await prisma.activity.create({
      data,
      include: { assignee: true },
    });

    await logAudit({
      entityType: "activity",
      entityId: created.id,
      action: "activity.created",
      description: `Activity "${created.subject}" (${created.type}) created`,
      userId: user.id,
      data: {
        leadId: created.leadId,
        opportunityId: created.opportunityId,
        customerId: created.customerId,
      },
    });

    return NextResponse.json(activityToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/activities", err);
    return serverError("Failed to create activity");
  }
}
