import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, forbidden, serverError, logServerError, isReportsManager } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { reportSchema } from "@/lib/validation/entities";

export type UIReport = {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  createdBy: string;
  createdAt: string;
  lastRun: string;
  status: string;
};

export function reportToUI(r: Prisma.ReportGetPayload<{ include: { createdBy: true } }>): UIReport {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    type: r.type,
    description: r.description ?? "",
    createdBy: r.createdBy?.name ?? "",
    createdAt: r.createdAt.toISOString().split("T")[0],
    lastRun: r.lastRun ? r.lastRun.toISOString().split("T")[0] : "",
    status: r.status,
  };
}

export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isReportsManager(user)) return forbidden();
  try {
    const reports = await prisma.report.findMany({
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: reports.map(reportToUI), total: reports.length });
  } catch (err) {
    logServerError("GET /api/reports/manage", err);
    return serverError("Failed to fetch reports");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isReportsManager(user)) return forbidden();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = reportSchema.parse(body);

    const data: Prisma.ReportCreateInput = {
      name: parsed.name,
      category: parsed.category,
      type: parsed.type,
      description: parsed.description,
      status: parsed.status,
      lastRun: parsed.lastRun ? new Date(parsed.lastRun) : null,
      createdBy: { connect: { id: user.id } },
    };
    const created = await prisma.report.create({ data, include: { createdBy: true } });

    await logAudit({
      entityType: "report",
      entityId: created.id,
      action: "report.created",
      description: `Report "${created.name}" created`,
      userId: user.id,
    });

    return NextResponse.json(reportToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/reports/manage", err);
    return serverError("Failed to create report");
  }
}
