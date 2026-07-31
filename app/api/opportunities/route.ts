import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { logAudit, createActivity } from "@/lib/server/records";
import { opportunitySchema } from "@/lib/validation/entities";
import type { PipelineStageName, Prisma } from "@/generated/prisma/client";

export type UIOpportunity = {
  id: string;
  title: string;
  customer: string;
  customerId: string;
  value: number;
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
  include: { customer: true; stage: true; owner: true };
}>;

export function opportunityToUI(c: OpportunityWithRelations): UIOpportunity {
  return {
    id: c.id,
    title: c.title,
    customer: c.customer?.name ?? "",
    customerId: c.customerId ?? "",
    value: c.value,
    stage: c.stage?.name ?? "",
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

export function uiStageToDb(stage: string): PipelineStageName | undefined {
  const map: Record<string, PipelineStageName> = {
    Qualification: "Qualification",
    Discovery: "Discovery",
    Proposal: "Proposal",
    Negotiation: "Negotiation",
    "Closed Won": "ClosedWon",
    "Closed Lost": "ClosedLost",
  };
  return map[stage];
}

export function dbStageToUi(stage: string): string {
  return stage === "ClosedWon" ? "Closed Won" : stage === "ClosedLost" ? "Closed Lost" : stage;
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

  const where: Prisma.OpportunityWhereInput = {};
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
        include: { customer: true, stage: true, owner: true },
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
      include: { customer: true, stage: true, owner: true },
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
    logServerError("POST /api/opportunities", err);
    return serverError("Failed to create opportunity");
  }
}
