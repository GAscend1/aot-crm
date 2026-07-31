import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { dbStageToUi } from "@/lib/server/opportunity-stages";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const opp = await prisma.opportunity.findUnique({ where: { id }, select: { id: true } });
    if (!opp) return notFound("Opportunity not found");
    const history = await prisma.opportunityStageHistory.findMany({
      where: { opportunityId: id },
      include: {
        fromStage: true,
        toStage: true,
        changedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      data: history.map((h) => ({
        id: h.id,
        fromStage: h.fromStage ? dbStageToUi(h.fromStage.name) : null,
        toStage: h.toStage ? dbStageToUi(h.toStage.name) : null,
        changedBy: h.changedBy?.name ?? "System",
        createdAt: h.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    logServerError(`GET /api/opportunities/${id}/history`, err);
    return serverError("Failed to fetch opportunity history");
  }
}
