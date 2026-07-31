import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { documentSchema } from "@/lib/validation/entities";
import { documentToUI } from "../route";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const doc = await prisma.document.findUnique({ where: { id }, include: { uploadedBy: true } });
    if (!doc) return notFound("Document not found");
    return NextResponse.json(documentToUI(doc));
  } catch (err) {
    logServerError(`GET /api/documents/${id}`, err);
    return serverError("Failed to fetch document");
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
    const parsed = documentSchema.partial().parse(body);
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return notFound("Document not found");

    const data: Prisma.DocumentUpdateInput = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.type !== undefined) data.type = parsed.type ?? null;
    if (parsed.mimeType !== undefined) data.mimeType = parsed.mimeType ?? null;
    if (parsed.size !== undefined) data.size = parsed.size;
    if (parsed.category !== undefined) data.category = parsed.category ?? null;
    if (parsed.description !== undefined) data.description = parsed.description ?? null;
    if (parsed.tags !== undefined) data.tags = parsed.tags;
    if (parsed.version !== undefined) data.version = parsed.version ?? null;
    if (parsed.status !== undefined) data.status = parsed.status ?? "Active";
    if (parsed.url !== undefined) data.url = parsed.url ?? null;
    if (parsed.storageKey !== undefined) data.storageKey = parsed.storageKey ?? null;
    if (parsed.customerId !== undefined) {
      data.customer = parsed.customerId ? { connect: { id: parsed.customerId } } : { disconnect: true };
    }
    if (parsed.opportunityId !== undefined) {
      data.opportunity = parsed.opportunityId ? { connect: { id: parsed.opportunityId } } : { disconnect: true };
    }
    if (parsed.leadId !== undefined) {
      data.lead = parsed.leadId ? { connect: { id: parsed.leadId } } : { disconnect: true };
    }
    if (parsed.companyId !== undefined) {
      data.company = parsed.companyId ? { connect: { id: parsed.companyId } } : { disconnect: true };
    }

    const updated = await prisma.document.update({ where: { id }, data, include: { uploadedBy: true } });

    await logAudit({
      entityType: "document",
      entityId: id,
      action: "document.updated",
      description: `Document "${updated.name}" updated`,
      userId: user.id,
    });

    return NextResponse.json(documentToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/documents/${id}`, err);
    return serverError("Failed to update document");
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
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return notFound("Document not found");
    await prisma.document.delete({ where: { id } });
    await logAudit({
      entityType: "document",
      entityId: id,
      action: "document.deleted",
      description: `Document "${existing.name}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/documents/${id}`, err);
    return serverError("Failed to delete document");
  }
}
