import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, zodValidationError } from "@/lib/server/api";
import { logAudit, createActivity } from "@/lib/server/records";
import { opportunitySchema } from "@/lib/validation/entities";
import { uiStageToDb, dbStageToUi } from "@/lib/server/opportunity-stages";
import type { PipelineStageName, Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

export type UIOpportunity = {
  id: string;
  title: string;
  customer: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  companyId: string;
  companyWebsite: string;
  contact: string;
  leadId: string;
  leadName: string;
  leadSource: string;
  value: number;
  priority: string;
  stage: string;
  stageId: string;
  probability: number;
  expectedCloseDate: string;
  owner: string;
  ownerId: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityWithRelations = Prisma.OpportunityGetPayload<{
  include: {
    customer: { include: { company: true } };
    stage: true;
    owner: true;
    lead: { select: { id: true; source: true; firstName: true; lastName: true; companyName: true } };
  };
}>;

export const opportunityInclude = {
  customer: { include: { company: true } },
  stage: true,
  owner: true,
  lead: { select: { id: true, source: true, firstName: true, lastName: true, companyName: true } },
} as const;

export function opportunityToUI(c: OpportunityWithRelations): UIOpportunity {
  return {
    id: c.id,
    title: c.title,
    customer: c.customer?.name ?? "",
    customerId: c.customerId ?? "",
    customerEmail: c.customer?.email ?? "",
    customerPhone: c.customer?.phone ?? "",
    company: c.customer?.company?.companyName ?? "",
    companyId: c.customer?.companyId ?? "",
    companyWebsite: c.customer?.company?.website ?? "",
    contact: c.customer?.name ?? "",
    leadId: c.lead?.id ?? "",
    leadName: c.lead ? `${c.lead.firstName} ${c.lead.lastName}`.trim() || c.lead.companyName || "" : "",
    leadSource: c.lead?.source ?? "",
    value: c.value,
    priority: c.priority ?? "Medium",
    stage: dbStageToUi(c.stage?.name ?? ""),
    stageId: c.stageId ?? "",
    probability: c.probability,
    expectedCloseDate: c.expectedCloseDate?.toISOString() ?? "",
    owner: c.owner?.name ?? "",
    ownerId: c.ownerId ?? "",
    notes: c.notes ?? "",
    status: c.status ?? "Open",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export { uiStageToDb, dbStageToUi };

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

  const where: Prisma.OpportunityWhereInput = {};
  if (searchParams.get("includeArchived") !== "true") where.archivedAt = null;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (filters) {
    try {
      const parsed = JSON.parse(filters) as Record<string, unknown>;
      if (parsed.status) where.status = parsed.status as string;
      if (parsed.customerId) where.customerId = String(parsed.customerId);
      if (parsed.companyId) where.customer = { companyId: String(parsed.companyId) };
      if (parsed.stage) where.stage = { name: uiStageToDb(String(parsed.stage)) as PipelineStageName };
    } catch {
      /* ignore invalid JSON */
    }
  }

  const orderBy: Prisma.OpportunityOrderByWithRelationInput = {};
  if (sortBy === "customer") orderBy.customer = { name: sortOrder };
  else if (sortBy === "stage") orderBy.stage = { name: sortOrder };
  else if (sortBy === "owner") orderBy.owner = { name: sortOrder };
  else (orderBy as Record<string, string>)[sortBy] = sortOrder;

  try {
    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: opportunityInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.opportunity.count({ where }),
    ]);
    return NextResponse.json({
      data: data.map(opportunityToUI),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    logServerError("GET /api/opportunities", err);
    return serverError("Failed to fetch opportunities");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = opportunitySchema.parse(body);

    const data: Prisma.OpportunityCreateInput = {
      title: parsed.title,
      value: parsed.value ?? 0,
      probability: parsed.probability ?? 0,
      priority: parsed.priority ?? "Medium",
      notes: parsed.notes || undefined,
      status: parsed.status ?? "Open",
    };
    if (parsed.expectedCloseDate) data.expectedCloseDate = new Date(parsed.expectedCloseDate);
    if (parsed.stageId) data.stage = { connect: { id: parsed.stageId } };
    else if (parsed.stage) {
      const stage = await prisma.pipelineStage.findFirst({ where: { name: uiStageToDb(parsed.stage) } });
      if (stage) data.stage = { connect: { id: stage.id } };
    }
    if (parsed.customerId) data.customer = { connect: { id: parsed.customerId } };
    if (parsed.ownerId) data.owner = { connect: { id: parsed.ownerId } };

    const created = await prisma.opportunity.create({
      data,
      include: opportunityInclude,
    });

    await logAudit({
      entityType: "opportunity",
      entityId: created.id,
      action: "opportunity.created",
      description: `Opportunity "${created.title}" created`,
      userId: user.id,
      after: { title: created.title, value: created.value, stageId: created.stageId },
    });
    await createActivity({
      type: "Note",
      subject: "Opportunity created",
      description: `Opportunity "${created.title}" was created`,
      status: "Completed",
      opportunityId: created.id,
      customerId: created.customerId,
    });

    return NextResponse.json(opportunityToUI(created), { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return zodValidationError(err, "OPPORTUNITY_VALIDATION_FAILED", "Invalid opportunity data.");
    }
    logServerError("POST /api/opportunities", err);
    return serverError("Failed to create opportunity");
  }
}
