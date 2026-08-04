import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, apiError, zodValidationError } from "@/lib/server/api";
import { logAudit, createActivity, createNotification } from "@/lib/server/records";
import { opportunitySchema } from "@/lib/validation/entities";
import type { Prisma } from "@/generated/prisma/client";
import { opportunityToUI, opportunityInclude, uiStageToDb, dbStageToUi } from "../route";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: opportunityInclude,
    });
    if (!opp) return notFound("Opportunity not found");
    return NextResponse.json(opportunityToUI(opp));
  } catch (err) {
    logServerError(`GET /api/opportunities/${id}`, err);
    return serverError("Failed to fetch opportunity");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    let parsed;
    try {
      parsed = opportunitySchema.partial().parse(body);
    } catch (err) {
      return zodValidationError(err, "OPPORTUNITY_UPDATE_FAILED", "The opportunity could not be updated.");
    }
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) return notFound("Opportunity not found");

    const data: Prisma.OpportunityUpdateInput = {};
    const changes: string[] = [];

    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.value !== undefined) data.value = parsed.value;
    if (parsed.probability !== undefined) data.probability = parsed.probability;
    if (parsed.priority !== undefined) data.priority = parsed.priority;
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.notes !== undefined) data.notes = parsed.notes || null;
    if (parsed.expectedCloseDate !== undefined) {
      data.expectedCloseDate = parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null;
    }
    if (parsed.customerId !== undefined) {
      data.customer = parsed.customerId ? { connect: { id: parsed.customerId } } : { disconnect: true };
    }
    if (parsed.ownerId !== undefined) {
      data.owner = parsed.ownerId ? { connect: { id: parsed.ownerId } } : { disconnect: true };
    }

    let stageChanged = false;
    let fromStageId: string | null = null;
    let toStageId: string | null = null;
    if (parsed.stageId !== undefined) {
      toStageId = parsed.stageId;
      data.stage = parsed.stageId ? { connect: { id: parsed.stageId } } : { disconnect: true };
    } else if (parsed.stage !== undefined) {
      const stage = await prisma.pipelineStage.findFirst({ where: { name: uiStageToDb(parsed.stage) } });
      toStageId = stage?.id ?? null;
      data.stage = stage ? { connect: { id: stage.id } } : { disconnect: true };
    }
    if (toStageId !== existing.stageId && toStageId !== null) {
      stageChanged = true;
      fromStageId = existing.stageId;
      changes.push(
        `stage moved from "${existing.stageId ? await stageName(existing.stageId) : "—"}" to "${await stageName(toStageId)}"`
      );
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data,
      include: opportunityInclude,
    });

    if (stageChanged && toStageId) {
      await prisma.opportunityStageHistory.create({
        data: {
          opportunityId: id,
          fromStageId,
          toStageId,
          changedById: user.id,
        },
      });
    }

    if (stageChanged) {
      await createActivity({
        type: "Note",
        subject: "Stage changed",
        description: `Moved to stage "${updated.stage?.name ?? "—"}"`,
        status: "Completed",
        opportunityId: id,
        customerId: updated.customerId,
      });
      await createNotification({
        userId: user.id,
        type: "Info",
        title: `Opportunity "${updated.title}" moved to ${dbStageToUi(updated.stage?.name ?? "")}`,
        message: `Stage changed from "${fromStageId ? await stageName(fromStageId) : "—"}" to "${dbStageToUi(updated.stage?.name ?? "")}"`,
        entityType: "opportunity",
        entityId: id,
        actionLink: `/opportunities/${id}`,
      });
    }

    if (parsed.ownerId !== undefined && parsed.ownerId !== existing.ownerId && parsed.ownerId) {
      await createNotification({
        userId: parsed.ownerId,
        type: "Info",
        title: `Opportunity "${updated.title}" assigned to you`,
        message: `You have been assigned as the owner of ${updated.title}`,
        entityType: "opportunity",
        entityId: id,
        actionLink: `/opportunities/${id}`,
      });
    }

    await logAudit({
      entityType: "opportunity",
      entityId: id,
      action: "opportunity.updated",
      description: changes.length > 0 ? changes.join(", ") : "Opportunity updated",
      userId: user.id,
      before: { ...existing } as Record<string, unknown>,
      after: { ...updated } as Record<string, unknown>,
    });

    return NextResponse.json(opportunityToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/opportunities/${id}`, err);
    return apiError(500, "OPPORTUNITY_UPDATE_FAILED", "The opportunity could not be updated.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) return notFound("Opportunity not found");
    await prisma.opportunity.update({ where: { id }, data: { archivedAt: new Date() } });
    await logAudit({
      entityType: "opportunity",
      entityId: id,
      action: "opportunity.archived",
      description: `Opportunity "${existing.title}" archived`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/opportunities/${id}`, err);
    return apiError(500, "OPPORTUNITY_DELETE_FAILED", "The opportunity could not be archived.");
  }
}

async function stageName(id: string): Promise<string> {
  const stage = await prisma.pipelineStage.findUnique({ where: { id }, select: { name: true } });
  return stage ? dbStageToUi(stage.name) : id;
}
