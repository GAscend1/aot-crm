import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbStageToUi } from "@/lib/server/opportunity-stages";

export const dynamic = "force-dynamic";

export async function GET() {
  const [customerCount, companyCount, opportunityCount, ticketCount, oppAgg, customers, companies, opportunities, tickets, activities] = await Promise.all([
    prisma.customer.count(),
    prisma.company.count(),
    prisma.opportunity.count(),
    prisma.ticket.count({ where: { status: { not: "Closed" } } }),
    prisma.opportunity.aggregate({ _sum: { value: true } }),
    prisma.customer.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { company: { select: { companyName: true } } },
    }),
    prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.opportunity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        stage: { select: { name: true } },
      },
    }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.activity.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      where: { type: "Task" },
    }),
  ]);

  const kpis = [
    { title: "Total Revenue", value: `$${((oppAgg._sum.value || 0) / 1000).toFixed(1)}k`, change: 12.5 },
    { title: "Customers", value: customerCount, change: 8.2 },
    { title: "Companies", value: companyCount, change: -2.4 },
    { title: "Opportunities", value: opportunityCount, change: 16.1 },
    { title: "Open Tickets", value: ticketCount, change: -11.3 },
  ];

  const recentCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company?.companyName ?? "",
    email: c.email,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  const recentCompanies = companies.map((c) => ({
    id: c.id,
    name: c.companyName,
    industry: c.industry,
    city: c.city,
    country: c.country,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  const recentOpportunities = opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    customer: o.customer?.name ?? "",
    value: o.value,
    stage: dbStageToUi(o.stage?.name ?? "Discovery"),
    probability: o.probability,
    createdAt: o.createdAt.toISOString(),
  }));

  const recentTickets = tickets.map((t) => ({
    id: t.id,
    subject: t.title,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  const recentTasks = activities.map((a) => ({
    id: a.id,
    subject: a.subject,
    status: a.status,
    dueDate: a.dueDate?.toISOString() ?? a.createdAt.toISOString(),
    priority: "Medium" as const,
    assignee: "",
  }));

  return NextResponse.json({
    kpis,
    recentCustomers,
    recentCompanies,
    recentOpportunities,
    recentTickets,
    recentTasks,
  });
}
