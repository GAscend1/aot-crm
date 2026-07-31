import { prisma } from "@/lib/prisma";
import { searchToOrConditions } from "@/repositories/prisma/PrismaRepository";
import type { QueryOptions, PaginatedResult } from "@/repositories/base/IRepository";

export interface DashboardKPI {
  title: string;
  value: string | number;
  change: number;
}

export interface DashboardCustomer {
  id: string;
  name: string;
  company: string;
  email: string | null;
  status: string;
  createdAt: Date;
}

export interface DashboardCompany {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  status: string;
  createdAt: Date;
}

export interface DashboardOpportunity {
  id: string;
  title: string;
  customer: string;
  value: number;
  stage: string;
  probability: number;
  createdAt: Date;
}

export interface DashboardTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: Date;
}

async function getKPIs(): Promise<DashboardKPI[]> {
  const [customerCount, companyCount, opportunityCount, ticketCount, oppAgg] = await Promise.all([
    prisma.customer.count(),
    prisma.company.count(),
    prisma.opportunity.count(),
    prisma.ticket.count({ where: { status: { not: "Closed" } } }),
    prisma.opportunity.aggregate({ _sum: { value: true } }),
  ]);

  return [
    {
      title: "Total Revenue",
      value: `$${((oppAgg._sum.value || 0) / 1000).toFixed(1)}k`,
      change: 12.5,
    },
    { title: "Customers", value: customerCount, change: 8.2 },
    { title: "Companies", value: companyCount, change: -2.4 },
    { title: "Opportunities", value: opportunityCount, change: 16.1 },
    { title: "Open Tickets", value: ticketCount, change: -11.3 },
  ];
}

async function getRecentCustomers(limit = 5): Promise<DashboardCustomer[]> {
  const customers = await prisma.customer.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { company: { select: { companyName: true } } },
  });
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company?.companyName ?? "",
    email: c.email,
    status: c.status,
    createdAt: c.createdAt,
  }));
}

async function getRecentCompanies(limit = 5): Promise<DashboardCompany[]> {
  const companies = await prisma.company.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return companies.map((c) => ({
    id: c.id,
    name: c.companyName,
    industry: c.industry,
    city: c.city,
    country: c.country,
    status: c.status,
    createdAt: c.createdAt,
  }));
}

async function getRecentOpportunities(limit = 5): Promise<DashboardOpportunity[]> {
  const opportunities = await prisma.opportunity.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      stage: { select: { name: true } },
    },
  });
  return opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    customer: o.customer?.name ?? "",
    value: o.value,
    stage: o.stage?.name ?? "Discovery",
    probability: o.probability,
    createdAt: o.createdAt,
  }));
}

async function getRecentTickets(limit = 5): Promise<DashboardTicket[]> {
  const tickets = await prisma.ticket.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return tickets.map((t) => ({
    id: t.id,
    subject: t.title,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt,
  }));
}

export const dashboardService = {
  getKPIs,
  getRecentCustomers,
  getRecentCompanies,
  getRecentOpportunities,
  getRecentTickets,
};

export async function findAllCustomersRaw(options?: QueryOptions): Promise<PaginatedResult<DashboardCustomer>> {
  const { search, sortBy, sortOrder, page, pageSize } = options || {};
  const where: Record<string, unknown> = {};
  const orConditions = searchToOrConditions(search);
  if (orConditions) where.OR = orConditions;
  const take = pageSize || 50;
  const skip = ((page || 1) - 1) * take;
  const orderBy = sortBy ? { [sortBy]: sortOrder || "asc" as const } : { createdAt: "desc" as const };
  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where: where as never,
      orderBy,
      skip,
      take,
      include: { company: { select: { companyName: true } } },
    }),
    prisma.customer.count({ where: where as never }),
  ]);
  const mapped = data.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company?.companyName ?? "",
    email: c.email,
    status: c.status,
    createdAt: c.createdAt,
  }));
  return { data: mapped, total, page: page || 1, pageSize: take, totalPages: Math.ceil(total / take) };
}
