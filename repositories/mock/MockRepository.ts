import { v4 as uuid } from "uuid";
import type { IRepository, PaginatedResult, QueryOptions } from "@/repositories/base/IRepository";

export class MockRepository<T extends { id: string }>
  implements IRepository<T>
{
  protected store: Map<string, T> = new Map();

  constructor(initialData: T[] = []) {
    for (const item of initialData) {
      this.store.set(item.id, item);
    }
  }

  async findAll(options?: QueryOptions): Promise<PaginatedResult<T>> {
    let items = Array.from(this.store.values());

    if (options?.search) {
      const q = options.search.toLowerCase();
      items = items.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      );
    }

    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null && value !== "") {
          items = items.filter(
            (item) => (item as Record<string, unknown>)[key] === value
          );
        }
      }
    }

    if (options?.sortBy) {
      items.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[options.sortBy!];
        const bVal = (b as Record<string, unknown>)[options.sortBy!];
        const cmp = String(aVal).localeCompare(String(bVal));
        return options.sortOrder === "desc" ? -cmp : cmp;
      });
    }

    const total = items.length;
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = items.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages };
  }

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    return Array.from(this.store.values()).filter(predicate);
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    } as unknown as T;
    this.store.set(item.id, item);
    return item;
  }

  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>
  ): Promise<T> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Entity with id ${id} not found`);
    const updated = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    } as T;
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`Entity with id ${id} not found`);
    this.store.delete(id);
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  async search(query: string): Promise<T[]> {
    const q = query.toLowerCase();
    return Array.from(this.store.values()).filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(q))
    );
  }
}
