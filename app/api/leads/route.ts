import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, zodValidationError, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit, createActivity, leadDisplayName } from "@/lib/server/records";
import { leadCreateSchema } from "@/lib/validation/entities";
import type { LeadStatus, Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

export type UILead = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  source: string;
  score: number;
  probability: number;
  owner: string;
  ownerId: string;
  expectedRevenue: number;
  expectedCloseDate: string;
  status: string;
  isFavorite: boolean;
  tags: string[];
  notes: string;
  convertedAt: string;
  /** Linked account record created/reused at conversion. */
  convertedCustomerId: string;
  /** Linked person record created/reused at conversion (via the customer). */
  convertedContactId: string;
  convertedOpportunityId: string;
  createdAt: string;
  updatedAt: string;
};

/** Include required by leadToUI to surface the post-conversion contact link. */
export const leadUIInclude = {
  assignedTo: true,
  customer: { select: { contactId: true } },
} as const;

export function leadToUI(
  c: Prisma.LeadGetPayload<{ include: typeof leadUIInclude }>
): UILead {
  return {
    id: c.id,
    title: c.title ?? c.companyName ?? `${c.firstName} ${c.lastName}`.trim(),
    firstName: c.firstName,
    lastName: c.lastName,
    company: c.companyName ?? "",
    contactName: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email ?? "",
    phone: c.phone ?? "",
    source: c.source ?? "",
    score: c.score,
    probability: c.probability,
    owner: c.assignedTo?.name ?? "",
    ownerId: c.assignedToId ?? "",
    expectedRevenue: c.expectedRevenue,
    expectedCloseDate: c.expectedCloseDate?.toISOString() ?? "",
    status: c.status,
    isFavorite: c.isFavorite,
    tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
    notes: c.notes ?? "",
    convertedAt: c.convertedAt?.toISOString() ?? "",
    convertedCustomerId: c.customerId ?? "",
    convertedContactId: c.customer?.contactId ?? "",
    convertedOpportunityId: c.opportunityId ?? "",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function uiStatusToDb(status: string): LeadStatus {
  const map: Record<string, LeadStatus> = {
    New: "New",
    Contacted: "Contacted",
    Qualified: "Qualified",
    Proposal: "Proposal",
    Negotiation: "Negotiation",
    "Closed Won": "ClosedWon",
    "Closed Lost": "ClosedLost",
    Converted: "Converted",
    Disqualified: "Disqualified",
  };
  return map[status] ?? "New";
}

export function dbStatusToUi(status: string): string {
  return status === "ClosedWon" ? "Closed Won" : status === "ClosedLost" ? "Closed Lost" : status;
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

  const where: Prisma.LeadWhereInput = { organizationId: user.organizationId };
  if (searchParams.get("includeArchived") !== "true") where.archivedAt = null;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }
  if (filters) {
    try {
      const parsed = JSON.parse(filters) as Record<string, unknown>;
      if (parsed.status) where.status = uiStatusToDb(String(parsed.status));
      if (parsed.source) where.source = String(parsed.source);
      if (parsed.ownerId) where.assignedToId = String(parsed.ownerId);
      if (parsed.tag) where.tags = { array_contains: [String(parsed.tag)] };
    } catch {
      /* ignore invalid JSON */
    }
  }

  const orderBy: Prisma.LeadOrderByWithRelationInput = {};
  if (sortBy === "owner") orderBy.assignedTo = { name: sortOrder };
  else if (sortBy === "company") orderBy.companyName = sortOrder;
  else (orderBy as Record<string, string>)[sortBy] = sortOrder;

  try {
    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: leadUIInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);
    return NextResponse.json({
      data: data.map(leadToUI),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    logServerError("GET /api/leads", err);
    return serverError("Failed to fetch leads");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = leadCreateSchema.parse(body);
    const contactName = parsed.contactName ?? "";
    const parts = contactName.split(" ");
    const firstName = parsed.firstName ?? parts[0] ?? "";
    const lastName = parsed.lastName ?? parts.slice(1).join(" ") ?? "";

    const data: Prisma.LeadCreateInput = {
      organization: { connect: { id: user.organizationId } },
      firstName: firstName || "Unknown",
      lastName,
      title: parsed.title || undefined,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      companyName: parsed.company || undefined,
      source: parsed.source || undefined,
      score: parsed.score ?? 0,
      probability: parsed.probability ?? 0,
      expectedRevenue: parsed.expectedRevenue ?? 0,
      expectedCloseDate: parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : undefined,
      status: parsed.status ? uiStatusToDb(parsed.status) : "New",
      notes: parsed.notes || undefined,
      tags: parsed.tags ?? [],
      assignedTo: parsed.ownerId ? { connect: { id: parsed.ownerId } } : undefined,
    };

    const created = await prisma.lead.create({
      data,
      include: leadUIInclude,
    });

    await logAudit({
      entityType: "lead",
      entityId: created.id,
      action: "lead.created",
      description: `Lead "${leadDisplayName(created)}" created`,
      userId: user.id,
      organizationId: user.organizationId,
      after: { title: created.title, status: created.status },
    });
    await createActivity({
      type: "Note",
      subject: `Lead created`,
      description: `Lead "${leadDisplayName(created)}" was created`,
      status: "Completed",
      leadId: created.id,
      organizationId: user.organizationId,
    });

    return NextResponse.json(leadToUI(created), { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return zodValidationError(err, "LEAD_VALIDATION_FAILED", "Invalid lead data.");
    }
    logServerError("POST /api/leads", err);
    return serverError("Failed to create lead");
  }
}
