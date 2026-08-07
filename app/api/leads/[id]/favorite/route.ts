import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit, leadDisplayName } from "@/lib/server/records";
import { leadToUI, leadUIInclude } from "../../route";
export const dynamic = "force-dynamic";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const lead = await prisma.lead.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!lead) return notFound("Lead not found");
    const updated = await prisma.lead.update({
      where: { id },
      data: { isFavorite: !lead.isFavorite },
      include: leadUIInclude,
    });
    await logAudit({
      entityType: "lead",
      entityId: id,
      action: updated.isFavorite ? "lead.starred" : "lead.unstarred",
      description: `Lead "${leadDisplayName(lead)}" ${updated.isFavorite ? "starred" : "unstarred"}`,
      userId: user.id,
      after: { isFavorite: updated.isFavorite },
    });
    return NextResponse.json(leadToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/leads/${id}/favorite`, err);
    return serverError("Failed to update favorite");
  }
}
