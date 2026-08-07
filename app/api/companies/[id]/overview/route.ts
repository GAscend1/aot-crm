import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCrmUser,
  unauthorized,
  serverError,
  logServerError,
  notFound,
} from "@/lib/server/api";
import { companyToUI } from "../../route";
import { contactToUI } from "../../../contacts/route";
import { opportunityToUI, opportunityInclude } from "../../../opportunities/route";
import { documentToUI } from "../../../documents/route";
import { activityToUI } from "../../../activities/route";
import type { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

const ACTIVITY_INCLUDE = { assignee: true } as const;

export type CompanyOverview = {
  company: ReturnType<typeof companyToUI>;
  metrics: {
    peopleCount: number;
    customersCount: number;
    openOpportunities: number;
    pipelineValue: number;
    wonRevenue: number;
    openTickets: number;
    documentsCount: number;
    activitiesCount: number;
  };
  contacts: ReturnType<typeof contactToUI>[];
  customers: { id: string; name: string; status: string; email: string | null }[];
  opportunities: ReturnType<typeof opportunityToUI>[];
  quotes: { id: string; quoteNumber: string; status: string; total: number }[];
  invoices: { id: string; invoiceNumber: string; status: string; total: number }[];
  documents: ReturnType<typeof documentToUI>[];
  tickets: { id: string; title: string; status: string; priority: string }[];
  activities: ReturnType<typeof activityToUI>[];
  upcomingMeetings: ReturnType<typeof activityToUI>[];
  openTasks: ReturnType<typeof activityToUI>[];
  auditEvents: { id: string; action: string; description: string | null; createdAt: Date }[];
};    const ACTIVITY_SCOPE = (
  companyId: string,
  organizationId: string,
): Prisma.ActivityWhereInput => ({
  organizationId,
  OR: [{ companyId }, { customer: { companyId } }],
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const company = await prisma.company.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!company) return notFound("Company not found");

    const now = new Date();
    const openWhere: Prisma.OpportunityWhereInput = {
      customer: { companyId: id },
      organizationId: user.organizationId,
      archivedAt: null,
      status: { notIn: ["Won", "Lost"] },
    };
    const wonWhere: Prisma.OpportunityWhereInput = {
      customer: { companyId: id },
      organizationId: user.organizationId,
      archivedAt: null,
      OR: [{ status: "Won" }, { stage: { name: "ClosedWon" } }],
    };

    const [contacts, customers, opportunities, quotes, invoices, documents, tickets, activities, upcomingMeetings, openTasks, auditEvents, peopleCount, customersCount, openOpportunitiesCount, pipelineValue, wonRevenue, openTicketsCount, documentsCount, activitiesCount] =
      await Promise.all([
        prisma.contact.findMany({
          where: { companyId: id, organizationId: user.organizationId, archivedAt: null },
          include: { company: true },
          orderBy: { createdAt: "asc" },
          take: 50,
        }),
        prisma.customer.findMany({
          where: { companyId: id, organizationId: user.organizationId, archivedAt: null },
          select: { id: true, name: true, status: true, email: true },
          orderBy: { createdAt: "asc" },
          take: 20,
        }),
        prisma.opportunity.findMany({
          where: { customer: { companyId: id }, organizationId: user.organizationId, archivedAt: null },
          include: opportunityInclude,
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.quote.findMany({
          where: { companyId: id, organizationId: user.organizationId, archivedAt: null },
          select: { id: true, quoteNumber: true, status: true, total: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.invoice.findMany({
          where: { companyId: id, organizationId: user.organizationId, archivedAt: null },
          select: { id: true, invoiceNumber: true, status: true, total: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.document.findMany({
          where: { companyId: id, organizationId: user.organizationId, archivedAt: null },
          include: { uploadedBy: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.ticket.findMany({
          where: { customer: { companyId: id }, organizationId: user.organizationId },
          select: { id: true, title: true, status: true, priority: true },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
        prisma.activity.findMany({
          where: ACTIVITY_SCOPE(id, user.organizationId),
          include: ACTIVITY_INCLUDE,
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
        prisma.activity.findMany({
          where: { ...ACTIVITY_SCOPE(id, user.organizationId), type: "Meeting", dueDate: { gte: now }, status: { not: "Cancelled" } },
          include: ACTIVITY_INCLUDE,
          orderBy: { dueDate: "asc" },
          take: 8,
        }),
        prisma.activity.findMany({
          where: { ...ACTIVITY_SCOPE(id, user.organizationId), type: "Task", status: { notIn: ["Completed", "Cancelled"] } },
          include: ACTIVITY_INCLUDE,
          orderBy: { dueDate: "asc" },
          take: 8,
        }),
        prisma.auditLog.findMany({
          where: { entityType: "company", entityId: id, organizationId: user.organizationId },
          select: { id: true, action: true, description: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.contact.count({ where: { companyId: id, organizationId: user.organizationId, archivedAt: null } }),
        prisma.customer.count({ where: { companyId: id, organizationId: user.organizationId, archivedAt: null } }),
        prisma.opportunity.count({ where: openWhere }),
        prisma.opportunity.aggregate({ where: openWhere, _sum: { value: true } }),
        prisma.opportunity.aggregate({ where: wonWhere, _sum: { value: true } }),
        prisma.ticket.count({ where: { customer: { companyId: id }, organizationId: user.organizationId, status: { notIn: ["Closed", "Resolved"] } } }),
        prisma.document.count({ where: { companyId: id, organizationId: user.organizationId, archivedAt: null } }),
        prisma.activity.count({ where: ACTIVITY_SCOPE(id, user.organizationId) }),
      ]);

    return NextResponse.json({
      company: companyToUI(company),
      metrics: {
        peopleCount,
        customersCount,
        openOpportunities: openOpportunitiesCount,
        pipelineValue: pipelineValue._sum.value ?? 0,
        wonRevenue: wonRevenue._sum.value ?? 0,
        openTickets: openTicketsCount,
        documentsCount,
        activitiesCount,
      },
      contacts: contacts.map(contactToUI),
      customers,
      opportunities: opportunities.map(opportunityToUI),
      quotes,
      invoices,
      documents: documents.map(documentToUI),
      tickets,
      activities: activities.map(activityToUI),
      upcomingMeetings: upcomingMeetings.map(activityToUI),
      openTasks: openTasks.map(activityToUI),
      auditEvents,
    } satisfies CompanyOverview);
  } catch (err) {
    logServerError(`GET /api/companies/${id}/overview`, err);
    return serverError("Failed to fetch company overview");
  }
}
