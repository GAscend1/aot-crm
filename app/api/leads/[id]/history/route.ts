import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

export type LeadHistoryEntry = {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  timestamp: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  data?: Record<string, unknown>;
  source: "audit" | "activity";
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const [auditLogs, activities] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType: "lead", entityId: id, organizationId: user.organizationId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.activity.findMany({
        where: { leadId: id, organizationId: user.organizationId },
        include: { assignee: { select: { name: true } }, lead: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

    const history: LeadHistoryEntry[] = [
      ...auditLogs.map((log) => ({
        id: log.id,
        eventType: log.action,
        description:
          log.description ??
          `Record ${log.action.replace("lead.", "")} by ${log.user?.name ?? "System"}`,
        actor: log.user?.name ?? "System",
        timestamp: log.createdAt.toISOString(),
        before: log.before as Record<string, unknown> | undefined,
        after: log.after as Record<string, unknown> | undefined,
        data: log.data as Record<string, unknown> | undefined,
        source: "audit" as const,
      })),
      ...activities.map((activity) => ({
        id: activity.id,
        eventType: `activity.${activity.type.toLowerCase()}`,
        description: activity.subject + (activity.description ? ` — ${activity.description}` : ""),
        actor: activity.assignee?.name ?? activity.lead ? "CRM User" : "CRM User",
        timestamp: activity.createdAt.toISOString(),
        source: "activity" as const,
      })),
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return NextResponse.json({ data: history });
  } catch (err) {
    logServerError(`GET /api/leads/${id}/history`, err);
    return serverError("Failed to fetch lead history");
  }
}
