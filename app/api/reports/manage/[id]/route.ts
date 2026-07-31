import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, forbidden, serverError, logServerError, notFound, isReportsManager } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { reportSchema } from "@/lib/validation/entities";
import { reportToUI } from "../route";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isReportsManager(user)) return forbidden();
  const { id } = await params;
  try {
    const report = await prisma.report.findUnique({ where: { id }, include: { createdBy: true } });
    if (!report) return notFound("Report not found");
    return NextResponse.json(reportToUI(report));
  } catch (err) {
    logServerError(`GET /api/reports/manage/${id}`, err);
    return serverError("Failed to fetch report");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isReportsManager(user)) return forbidden();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = reportSchema.partial().parse(body);
    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) return notFound("Report not found");

    const data: Prisma.ReportUpdateInput = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.category !== undefined) data.category = parsed.category;
    if (parsed.type !== undefined) data.type = parsed.type;
    if (parsed.description !== undefined) data.description = parsed.description ?? null;
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.lastRun !== undefined) data.lastRun = parsed.lastRun ? new Date(parsed.lastRun) : null;

    const updated = await prisma.report.update({ where: { id }, data, include: { createdBy: true } });

    await logAudit({
      entityType: "report",
      entityId: id,
      action: "report.updated",
      description: `Report "${updated.name}" updated`,
      userId: user.id,
    });

    return NextResponse.json(reportToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/reports/manage/${id}`, err);
    return serverError("Failed to update report");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isReportsManager(user)) return forbidden();
  const { id } = await params;
  try {
    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) return notFound("Report not found");
    await prisma.report.delete({ where: { id } });
    await logAudit({
      entityType: "report",
      entityId: id,
      action: "report.deleted",
      description: `Report "${existing.name}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/reports/manage/${id}`, err);
    return serverError("Failed to delete report");
  }
}
