import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCrmUser,
  unauthorized,
  serverError,
  logServerError,
  notFound,
} from "@/lib/server/api";
import { contactToUI } from "../../route";
import { companyToUI } from "../../../companies/route";
import { opportunityToUI, opportunityInclude } from "../../../opportunities/route";
import { documentToUI } from "../../../documents/route";
import { activityToUI } from "../../../activities/route";
import type { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

const ACTIVITY_INCLUDE = { assignee: true } as const;

export type ContactOverview = {
  contact: ReturnType<typeof contactToUI>;
  company: ReturnType<typeof companyToUI> | null;
  metrics: {
    dealsCount: number;
    openDeals: number;
    pipelineValue: number;
    wonRevenue: number;
    documentsCount: number;
    activitiesCount: number;
  };
  deals: ReturnType<typeof opportunityToUI>[];
  documents: ReturnType<typeof documentToUI>[];
  activities: ReturnType<typeof activityToUI>[];
  upcomingMeetings: ReturnType<typeof activityToUI>[];
  openTasks: ReturnType<typeof activityToUI>[];
  auditEvents: { id: string; action: string; description: string | null; createdAt: Date }[];
  relatedContacts: { id: string; firstName: string; lastName: string; position: string | null; role: string | null }[];
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const contact = await prisma.contact.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { company: true },
    });
    if (!contact) return notFound("Contact not found");

    const companyId = contact.companyId;
    const now = new Date();

    const scope = (): Prisma.ActivityWhereInput =>
      companyId
        ? { organizationId: user.organizationId, OR: [{ companyId }, { customer: { companyId } }] }
        : { organizationId: user.organizationId };

    const openWhere: Prisma.OpportunityWhereInput = {
      customer: { companyId },
      organizationId: user.organizationId,
      archivedAt: null,
      status: { notIn: ["Won", "Lost"] },
    };
    const wonWhere: Prisma.OpportunityWhereInput = {
      customer: { companyId },
      organizationId: user.organizationId,
      archivedAt: null,
      OR: [{ status: "Won" }, { stage: { name: "ClosedWon" } }],
    };

    const [company, deals, documents, activities, upcomingMeetings, openTasks, auditEvents, relatedContacts, dealsCount, openDealsCount, pipelineValue, wonRevenue, documentsCount, activitiesCount] =
      companyId
        ? await Promise.all([
            prisma.company.findUnique({ where: { id: companyId } }),
            prisma.opportunity.findMany({
              where: { customer: { companyId }, organizationId: user.organizationId, archivedAt: null },
              include: opportunityInclude,
              orderBy: { updatedAt: "desc" },
              take: 20,
            }),
            prisma.document.findMany({
              where: { companyId, organizationId: user.organizationId, archivedAt: null },
              include: { uploadedBy: true },
              orderBy: { createdAt: "desc" },
              take: 10,
            }),
            prisma.activity.findMany({
              where: scope(),
              include: ACTIVITY_INCLUDE,
              orderBy: { createdAt: "desc" },
              take: 25,
            }),
            prisma.activity.findMany({
              where: { ...scope(), type: "Meeting", dueDate: { gte: now }, status: { not: "Cancelled" } },
              include: ACTIVITY_INCLUDE,
              orderBy: { dueDate: "asc" },
              take: 8,
            }),
            prisma.activity.findMany({
              where: { ...scope(), type: "Task", status: { notIn: ["Completed", "Cancelled"] } },
              include: ACTIVITY_INCLUDE,
              orderBy: { dueDate: "asc" },
              take: 8,
            }),
            prisma.auditLog.findMany({
              where: { entityType: "contact", entityId: id, organizationId: user.organizationId },
              select: { id: true, action: true, description: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 20,
            }),
            prisma.contact.findMany({
              where: { companyId, organizationId: user.organizationId, archivedAt: null, id: { not: id } },
              select: { id: true, firstName: true, lastName: true, position: true, role: true },
              orderBy: { createdAt: "asc" },
              take: 12,
            }),
            prisma.opportunity.count({ where: openWhere }),
            prisma.opportunity.count({ where: wonWhere }),
            prisma.opportunity.aggregate({ where: openWhere, _sum: { value: true } }),
            prisma.opportunity.aggregate({ where: wonWhere, _sum: { value: true } }),
            prisma.document.count({ where: { companyId, organizationId: user.organizationId, archivedAt: null } }),
            prisma.activity.count({ where: scope() }),
          ])
        : [null, [], [], [], [], [], [], [], 0, 0, null, null, 0, 0];

    return NextResponse.json({
      contact: contactToUI(contact),
      company: company ? companyToUI(company) : null,
      metrics: {
        dealsCount,
        openDeals: openDealsCount,
        pipelineValue: pipelineValue?._sum.value ?? 0,
        wonRevenue: wonRevenue?._sum.value ?? 0,
        documentsCount,
        activitiesCount,
      },
      deals: deals.map(opportunityToUI),
      documents: documents.map(documentToUI),
      activities: activities.map(activityToUI),
      upcomingMeetings: upcomingMeetings.map(activityToUI),
      openTasks: openTasks.map(activityToUI),
      auditEvents,
      relatedContacts,
    } satisfies ContactOverview);
  } catch (err) {
    logServerError(`GET /api/contacts/${id}/overview`, err);
    return serverError("Failed to fetch contact overview");
  }
}
