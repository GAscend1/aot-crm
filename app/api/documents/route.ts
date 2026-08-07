import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { documentSchema } from "@/lib/validation/entities";
export const dynamic = "force-dynamic";

export type UIDocument = {
  id: string; name: string; category: string; type: string;
  size: string; uploadDate: string; uploadedBy: string;
  tags: string[]; version: string; description: string; status: string;
  createdAt: string; updatedAt: string;
};

export function documentToUI(c: Prisma.DocumentGetPayload<{ include: { uploadedBy: true } }>): UIDocument {
  return {
    id: c.id,
    name: c.name,
    category: c.category ?? "",
    type: c.type ?? "",
    size: c.size ? `${(c.size / 1024).toFixed(1)} KB` : "",
    uploadDate: c.createdAt.toISOString().split("T")[0],
    uploadedBy: c.uploadedBy?.name ?? "",
    tags: Array.isArray(c.tags) ? c.tags as string[] : [],
    version: c.version ?? "",
    description: c.description ?? "",
    status: c.status ?? "Active",
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

  const where: Prisma.DocumentWhereInput = { organizationId: user.organizationId };
  const leadId = searchParams.get("leadId");
  const opportunityId = searchParams.get("opportunityId");
  const customerId = searchParams.get("customerId");
  const companyId = searchParams.get("companyId");
  if (leadId) where.leadId = leadId;
  if (opportunityId) where.opportunityId = opportunityId;
  if (customerId) where.customerId = customerId;
  if (companyId) where.companyId = companyId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.DocumentOrderByWithRelationInput = {};
  if (sortBy === "uploadedBy") orderBy.uploadedBy = { name: sortOrder };
  else (orderBy as Record<string, string>)[sortBy] = sortOrder;

  try {
    const [data, total] = await Promise.all([
      prisma.document.findMany({ where, include: { uploadedBy: true }, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.document.count({ where }),
    ]);
    return NextResponse.json({ data: data.map(documentToUI), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    logServerError("GET /api/documents", err);
    return serverError("Failed to fetch documents");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = documentSchema.parse(body);

    const data: Prisma.DocumentCreateInput = {
      organization: { connect: { id: user.organizationId } },
      name: parsed.name,
      type: parsed.type,
      mimeType: parsed.mimeType,
      size: parsed.size,
      category: parsed.category,
      description: parsed.description,
      tags: parsed.tags ?? [],
      version: parsed.version,
      status: parsed.status ?? "Active",
      url: parsed.url,
      storageKey: parsed.storageKey,
      uploadedBy: { connect: { id: user.id } },
      customer: parsed.customerId ? { connect: { id: parsed.customerId } } : undefined,
      opportunity: parsed.opportunityId ? { connect: { id: parsed.opportunityId } } : undefined,
      lead: parsed.leadId ? { connect: { id: parsed.leadId } } : undefined,
      company: parsed.companyId ? { connect: { id: parsed.companyId } } : undefined,
    };
    const created = await prisma.document.create({ data, include: { uploadedBy: true } });

    await logAudit({
      entityType: "document",
      entityId: created.id,
      action: "document.created",
      description: `Document "${created.name}" created`,
      userId: user.id,
      organizationId: user.organizationId,
    });

    return NextResponse.json(documentToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/documents", err);
    return serverError("Failed to create document");
  }
}
