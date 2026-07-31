import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, EntityStatus } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { logAudit, findOrCreateCompany } from "@/lib/server/records";
import { customerSchema } from "@/lib/validation/entities";
export const dynamic = "force-dynamic";

export type UICustomer = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  position: string;
  country: string;
  city: string;
  status: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export function customerToUI(c: Prisma.CustomerGetPayload<{ include: { company: true } }>): UICustomer {
  return {
    id: c.id,
    name: c.name,
    company: c.company?.companyName ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    position: c.position ?? "",
    country: c.company?.country ?? "",
    city: c.company?.city ?? "",
    status: c.status,
    tags: Array.isArray(c.tags) ? c.tags as string[] : [],
    notes: c.notes ?? undefined,
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

  const where: Prisma.CustomerWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { company: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (filters) {
    try {
      const parsed = JSON.parse(filters) as Record<string, unknown>;
      if (parsed.status) where.status = parsed.status as EntityStatus;
    } catch { /* ignore invalid JSON */ }
  }

  const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
  if (sortBy === "company") {
    orderBy.company = { companyName: sortOrder };
  } else if (sortBy === "country" || sortBy === "city") {
    orderBy.company = { [sortBy]: sortOrder };
  } else {
    (orderBy as Record<string, string>)[sortBy] = sortOrder;
  }

  try {
    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { company: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      data: data.map(customerToUI),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    logServerError("GET /api/customers", err);
    return serverError("Failed to fetch customers");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = customerSchema.parse(body);

    const companyId = parsed.companyId ?? (parsed.company ? await findOrCreateCompany(parsed.company) : null);
    const data: Prisma.CustomerCreateInput = {
      name: parsed.name,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      status: (parsed.status ?? "Active") as EntityStatus,
      position: parsed.position,
      notes: parsed.notes,
      tags: parsed.tags ?? [],
      company: companyId ? { connect: { id: companyId } } : undefined,
    };

    const created = await prisma.customer.create({
      data,
      include: { company: true },
    });

    await logAudit({
      entityType: "customer",
      entityId: created.id,
      action: "customer.created",
      description: `Customer "${created.name}" created`,
      userId: user.id,
    });

    return NextResponse.json(customerToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/customers", err);
    return serverError("Failed to create customer");
  }
}
