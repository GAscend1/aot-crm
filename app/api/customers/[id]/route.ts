import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, EntityStatus } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, apiError, zodValidationError, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit, findOrCreateCompany } from "@/lib/server/records";
import { customerSchema } from "@/lib/validation/entities";
import { customerToUI } from "../route";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { company: true },
    });
    if (!customer) return notFound("Customer not found");
    return NextResponse.json(customerToUI(customer));
  } catch (err) {
    logServerError(`GET /api/customers/${id}`, err);
    return serverError("Failed to fetch customer");
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
      parsed = customerSchema.partial().parse(body);
    } catch (err) {
      return zodValidationError(err, "CUSTOMER_UPDATE_FAILED", "The customer could not be updated.");
    }
    const existing = await prisma.customer.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return notFound("Customer not found");

    const data: Prisma.CustomerUpdateInput = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.email !== undefined) data.email = parsed.email || null;
    if (parsed.phone !== undefined) data.phone = parsed.phone || null;
    if (parsed.status !== undefined) data.status = parsed.status as EntityStatus;
    if (parsed.position !== undefined) data.position = parsed.position || null;
    if (parsed.notes !== undefined) data.notes = parsed.notes || null;
    if (parsed.tags !== undefined) data.tags = parsed.tags ?? [];
    if (parsed.companyId !== undefined) {
      data.company = parsed.companyId ? { connect: { id: parsed.companyId } } : { disconnect: true };
    } else if (parsed.company !== undefined) {
      data.company = parsed.company ? { connect: { id: await findOrCreateCompany(parsed.company) ?? "" } } : { disconnect: true };
    }

    const updated = await prisma.customer.update({
      where: { id },
      data,
      include: { company: true },
    });

    await logAudit({
      entityType: "customer",
      entityId: id,
      action: "customer.updated",
      description: `Customer "${updated.name}" updated`,
      userId: user.id,
    });

    return NextResponse.json(customerToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/customers/${id}`, err);
    return apiError(500, "CUSTOMER_UPDATE_FAILED", "The customer could not be updated.");
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
    const existing = await prisma.customer.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return notFound("Customer not found");
    // Archive (soft delete) instead of hard delete: Customers are referenced by
    // opportunities, activities, documents, quotes, invoices, and leads. A hard
    // delete would either fail on foreign keys or silently orphan related data.
    await prisma.customer.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await logAudit({
      entityType: "customer",
      entityId: id,
      action: "customer.archived",
      description: `Customer "${existing.name}" archived`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/customers/${id}`, err);
    return apiError(500, "CUSTOMER_DELETE_FAILED", "The customer could not be deleted.");
  }
}
