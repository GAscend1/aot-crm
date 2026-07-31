import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit, findOrCreateCompany } from "@/lib/server/records";
import { contactSchema } from "@/lib/validation/entities";
import { contactToUI } from "../route";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const contact = await prisma.contact.findUnique({ where: { id }, include: { company: true } });
    if (!contact) return notFound("Contact not found");
    return NextResponse.json(contactToUI(contact));
  } catch (err) {
    logServerError(`GET /api/contacts/${id}`, err);
    return serverError("Failed to fetch contact");
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
    const parsed = contactSchema.partial().parse(body);
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) return notFound("Contact not found");

    const data: Prisma.ContactUpdateInput = {};
    if (parsed.firstName !== undefined) data.firstName = parsed.firstName;
    if (parsed.lastName !== undefined) data.lastName = parsed.lastName;
    if (parsed.email !== undefined) data.email = parsed.email || null;
    if (parsed.phone !== undefined) data.phone = parsed.phone || null;
    if (parsed.position !== undefined) data.position = parsed.position || null;
    if (parsed.country !== undefined) data.country = parsed.country || null;
    if (parsed.city !== undefined) data.city = parsed.city || null;
    if (parsed.notes !== undefined) data.notes = parsed.notes || null;
    if (parsed.tags !== undefined) data.tags = parsed.tags ?? [];
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.companyId !== undefined) {
      data.company = parsed.companyId ? { connect: { id: parsed.companyId } } : { disconnect: true };
    } else if (parsed.company !== undefined) {
      data.company = parsed.company ? { connect: { id: await findOrCreateCompany(parsed.company) ?? "" } } : { disconnect: true };
    }

    const updated = await prisma.contact.update({ where: { id }, data, include: { company: true } });

    await logAudit({
      entityType: "contact",
      entityId: id,
      action: "contact.updated",
      description: `Contact "${updated.firstName} ${updated.lastName}" updated`,
      userId: user.id,
    });

    return NextResponse.json(contactToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/contacts/${id}`, err);
    return serverError("Failed to update contact");
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
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) return notFound("Contact not found");
    await prisma.contact.delete({ where: { id } });
    await logAudit({
      entityType: "contact",
      entityId: id,
      action: "contact.deleted",
      description: `Contact "${existing.firstName} ${existing.lastName}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/contacts/${id}`, err);
    return serverError("Failed to delete contact");
  }
}
