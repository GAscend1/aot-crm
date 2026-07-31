import type {
  IRepository,
  PaginatedResult,
  QueryOptions,
} from "@/repositories/base/IRepository";

export type PrismaModelLike = {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  findUnique: (args: Record<string, unknown> & { where: { id: string } }) => Promise<unknown | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
  count: (args?: Record<string, unknown>) => Promise<number>;
};

export interface PrismaRepositoryConfig {
  searchFields?: string[];
  include?: Record<string, boolean>;
  defaultOrder?: Record<string, "asc" | "desc">;
}

export abstract class PrismaRepositoryBase<T extends { id: string }>
  implements IRepository<T>
{
  protected abstract model: PrismaModelLike;
  protected searchFields: string[] = [];
  protected include: unknown;
  protected defaultOrder: Record<string, "asc" | "desc"> = { createdAt: "desc" };

  async findAll(options?: QueryOptions): Promise<PaginatedResult<T>> {
    const { search, filters, sortBy, sortOrder, page, pageSize, include } = options || {};

    const where: Record<string, unknown> = { ...filters } as Record<string, unknown>;
    const orConditions = this.buildSearch(search);
    if (orConditions) where.OR = orConditions;

    const take = pageSize || 50;
    const skip = ((page || 1) - 1) * take;
    const orderBy = sortBy ? { [sortBy]: sortOrder || "asc" } : this.defaultOrder;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy,
        skip,
        take,
        include: include ?? this.include,
      }) as Promise<T[]>,
      this.model.count({ where }),
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
    return this.model.findUnique({
      where: { id },
      include: this.include,
    }) as Promise<T | null>;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const all = (await this.model.findMany({ include: this.include })) as T[];
    return all.filter(predicate);
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    return this.model.create({ data: data as Record<string, unknown> }) as Promise<T>;
  }

  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>
  ): Promise<T> {
    return this.model.update({
      where: { id },
      data: data as Record<string, unknown>,
    }) as Promise<T>;
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return this.model.count();
  }

  async search(query: string): Promise<T[]> {
    const orConditions = this.buildSearch(query);
    if (!orConditions) return [];
    return this.model.findMany({
      where: { OR: orConditions },
      include: this.include,
    }) as Promise<T[]>;
  }

  protected buildSearch(
    search?: string
  ): Record<string, unknown>[] | undefined {
    if (!search || this.searchFields.length === 0) return undefined;
    return this.searchFields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));
  }
}

export function searchToOrConditions(
  search?: string,
  fields: string[] = ["name", "email", "phone"]
): Record<string, unknown>[] | undefined {
  if (!search) return undefined;
  return fields.map((field) => ({
    [field]: { contains: search, mode: "insensitive" },
  }));
}
