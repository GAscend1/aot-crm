import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { leadToUI } from "../../route";
import type { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

type LeadWithOwner = Prisma.LeadGetPayload<{ include: { assignedTo: true } }>;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return notFound("Lead not found");
    const updated = await prisma.lead.update({
      where: { id },
      data: { archivedAt: new Date() },
      include: { assignedTo: true },
    });
    await logAudit({
      entityType: "lead",
      entityId: id,
      action: "lead.archived",
      description: `Lead \"${`${existing.firstName} ${existing.lastName}`.trim()}\" archived`,
      userId: user.id,
    });
    return NextResponse.json(leadToUI(updated));
  } catch (err) {
    logServerError(`POST /api/leads/${id}/archive`, err);
    return serverError("Failed to archive lead");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return notFound("Lead not found");
    const updated = await prisma.lead.update({
      where: { id },
      data: { archivedAt: null },
      include: { assignedTo: true },
    });
    await logAudit({
      entityType: "lead",
      entityId: id,
      action: "lead.restored",
      description: `Lead \"${`${existing.firstName} ${existing.lastName}`.trim()}\" restored`,
      userId: user.id,
    });
    return NextResponse.json(leadToUI(updated));
  } catch (err) {
    logServerError(`DELETE /api/leads/${id}/archive`, err);
    return serverError("Failed to restore lead");
  }
}

export type { LeadWithOwner };
