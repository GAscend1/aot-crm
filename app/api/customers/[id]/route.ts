import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, EntityStatus } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
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
    const customer = await prisma.customer.findUnique({
      where: { id },
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
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = customerSchema.partial().parse(body);
    const existing = await prisma.customer.findUnique({ where: { id } });
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
    return serverError("Failed to update customer");
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
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return notFound("Customer not found");
    await prisma.customer.delete({ where: { id } });
    await logAudit({
      entityType: "customer",
      entityId: id,
      action: "customer.deleted",
      description: `Customer "${existing.name}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/customers/${id}`, err);
    return serverError("Failed to delete customer");
  }
}
