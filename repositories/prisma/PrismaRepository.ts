import { prisma } from "@/lib/prisma";
import type {
  Customer, Company, Contact,
  Lead, Opportunity, Activity, Ticket, Document,
} from "@/generated/prisma/client";
import type { IRepository, PaginatedResult, QueryOptions } from "@/repositories/base/IRepository";

type PrismaDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  findUnique: (args: Record<string, unknown>) => Promise<unknown | null>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
  count: (args?: Record<string, unknown>) => Promise<number>;
};

export function searchToOrConditions(search?: string): Record<string, unknown>[] | undefined {
  if (!search) return undefined;
  return [
    { name: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
    { phone: { contains: search, mode: "insensitive" } },
  ];
}

export class PrismaRepository<T extends { id: string }> implements IRepository<T> {
  constructor(private delegate: PrismaDelegate) {}

  async findAll(options?: QueryOptions): Promise<PaginatedResult<T>> {
    const { search, filters, sortBy, sortOrder, page, pageSize } = options || {};

    const where: Record<string, unknown> = { ...filters } as Record<string, unknown>;
    const orConditions = searchToOrConditions(search);
    if (orConditions) where.OR = orConditions;

    const take = pageSize || 50;
    const skip = ((page || 1) - 1) * take;
    const orderBy = sortBy ? { [sortBy]: sortOrder || "asc" } : undefined;

    const [data, total] = await Promise.all([
      this.delegate.findMany({ where, orderBy, skip, take }) as Promise<T[]>,
      this.delegate.count({ where }),
    ]);

    return {
      data,
      total,
      page: page || 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.delegate.findUnique({ where: { id } });
    return result as T | null;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.delegate.findMany({}) as T[];
    return all.filter(predicate);
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const result = await this.delegate.create({ data: data as Record<string, unknown> });
    return result as T;
  }

  async update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T> {
    const result = await this.delegate.update({ where: { id }, data: data as Record<string, unknown> });
    return result as T;
  }

  async delete(id: string): Promise<void> {
    await this.delegate.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return this.delegate.count();
  }

  async search(query: string): Promise<T[]> {
    const orConditions = searchToOrConditions(query);
    if (!orConditions) return [];
    const result = await this.delegate.findMany({ where: { OR: orConditions } }) as T[];
    return result;
  }
}

export const prismaCustomerRepo = new PrismaRepository<Customer>(prisma.customer as unknown as PrismaDelegate);
export const prismaCompanyRepo = new PrismaRepository<Company>(prisma.company as unknown as PrismaDelegate);
export const prismaContactRepo = new PrismaRepository<Contact>(prisma.contact as unknown as PrismaDelegate);
export const prismaLeadRepo = new PrismaRepository<Lead>(prisma.lead as unknown as PrismaDelegate);
export const prismaOpportunityRepo = new PrismaRepository<Opportunity>(prisma.opportunity as unknown as PrismaDelegate);
export const prismaActivityRepo = new PrismaRepository<Activity>(prisma.activity as unknown as PrismaDelegate);
export const prismaTicketRepo = new PrismaRepository<Ticket>(prisma.ticket as unknown as PrismaDelegate);
export const prismaDocumentRepo = new PrismaRepository<Document>(prisma.document as unknown as PrismaDelegate);
