import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, Company } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { companySchema } from "@/lib/validation/entities";
export const dynamic = "force-dynamic";

export type UICompany = {
  id: string;
  name: string;
  industry: string;
  size: string;
  address: string;
  city: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  employeeCount: number;
  revenue: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function companyToUI(c: Company): UICompany {
  return {
    id: c.id,
    name: c.companyName,
    industry: c.industry ?? "",
    size: c.size ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    country: c.country ?? "",
    website: c.website ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    employeeCount: c.employeeCount ?? 0,
    revenue: c.revenue ?? "",
    status: c.status,
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

  const where: Prisma.CompanyWhereInput = {};
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
  if (sortBy === "name") {
    orderBy.companyName = sortOrder;
  } else {
    (orderBy as Record<string, string>)[sortBy === "employeeCount" ? "employeeCount" : sortBy] = sortOrder;
  }

  try {
    const [data, total] = await Promise.all([
      prisma.company.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.company.count({ where }),
    ]);
    return NextResponse.json({ data: data.map(companyToUI), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    logServerError("GET /api/companies", err);
    return serverError("Failed to fetch companies");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = companySchema.parse(body);
    const name = parsed.companyName ?? parsed.name ?? "";
    const data: Prisma.CompanyCreateInput = {
      companyName: name,
      industry: parsed.industry || undefined,
      website: parsed.website || undefined,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      country: parsed.country || undefined,
      city: parsed.city || undefined,
      address: parsed.address || undefined,
      employeeCount: parsed.employeeCount,
      size: parsed.size || undefined,
      revenue: parsed.revenue || undefined,
      status: parsed.status ?? "Active",
    };
    const created = await prisma.company.create({ data });
    await logAudit({
      entityType: "company",
      entityId: created.id,
      action: "company.created",
      description: `Company "${name}" created`,
      userId: user.id,
    });
    return NextResponse.json(companyToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/companies", err);
    return serverError("Failed to create company");
  }
}
