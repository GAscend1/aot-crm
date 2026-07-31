import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { companySchema } from "@/lib/validation/entities";
import { companyToUI } from "../route";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return notFound("Company not found");
    return NextResponse.json(companyToUI(company));
  } catch (err) {
    logServerError(`GET /api/companies/${id}`, err);
    return serverError("Failed to fetch company");
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
    const parsed = companySchema.partial().parse(body);
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) return notFound("Company not found");

    const data: Prisma.CompanyUpdateInput = {};
    const name = parsed.companyName ?? parsed.name;
    if (name !== undefined) data.companyName = name;
    if (parsed.industry !== undefined) data.industry = parsed.industry || null;
    if (parsed.website !== undefined) data.website = parsed.website || null;
    if (parsed.email !== undefined) data.email = parsed.email || null;
    if (parsed.phone !== undefined) data.phone = parsed.phone || null;
    if (parsed.country !== undefined) data.country = parsed.country || null;
    if (parsed.city !== undefined) data.city = parsed.city || null;
    if (parsed.address !== undefined) data.address = parsed.address || null;
    if (parsed.employeeCount !== undefined) data.employeeCount = parsed.employeeCount;
    if (parsed.size !== undefined) data.size = parsed.size || null;
    if (parsed.revenue !== undefined) data.revenue = parsed.revenue || null;
    if (parsed.status !== undefined) data.status = parsed.status;

    const updated = await prisma.company.update({ where: { id }, data });
    await logAudit({
      entityType: "company",
      entityId: id,
      action: "company.updated",
      description: `Company "${updated.companyName}" updated`,
      userId: user.id,
    });
    return NextResponse.json(companyToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/companies/${id}`, err);
    return serverError("Failed to update company");
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
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) return notFound("Company not found");
    await prisma.company.delete({ where: { id } });
    await logAudit({
      entityType: "company",
      entityId: id,
      action: "company.deleted",
      description: `Company "${existing.companyName}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/companies/${id}`, err);
    return serverError("Failed to delete company");
  }
}
