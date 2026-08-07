import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, apiError, zodValidationError, subscriptionWriteGate } from "@/lib/server/api";
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
    const company = await prisma.company.findFirst({ where: { id, organizationId: user.organizationId } });
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
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    let parsed;
    try {
      parsed = companySchema.partial().parse(body);
    } catch (err) {
      return zodValidationError(err, "COMPANY_UPDATE_FAILED", "The company could not be updated.");
    }
    const existing = await prisma.company.findFirst({ where: { id, organizationId: user.organizationId } });
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
    return apiError(500, "COMPANY_UPDATE_FAILED", "The company could not be updated.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const existing = await prisma.company.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return notFound("Company not found");
    // Archive (soft delete): Companies are referenced by contacts, customers,
    // opportunities, quotes, invoices, and documents. Archiving keeps those
    // links intact while removing the company from active lists.
    await prisma.company.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await logAudit({
      entityType: "company",
      entityId: id,
      action: "company.archived",
      description: `Company "${existing.companyName}" archived`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/companies/${id}`, err);
    return apiError(500, "COMPANY_DELETE_FAILED", "The company could not be deleted.");
  }
}
