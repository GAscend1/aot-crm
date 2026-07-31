import type { IRepository, PaginatedResult, QueryOptions } from "@/repositories/base/IRepository";

export class ApiRepository<T extends { id: string }> implements IRepository<T> {
  constructor(private basePath: string) {}

  private async request(path: string, options?: RequestInit): Promise<unknown> {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
    }
    return res.json();
  }

  async findAll(options?: QueryOptions): Promise<PaginatedResult<T>> {
    const params = new URLSearchParams();
    if (options?.page) params.set("page", String(options.page));
    if (options?.pageSize) params.set("pageSize", String(options.pageSize));
    if (options?.sortBy) params.set("sortBy", options.sortBy);
    if (options?.sortOrder) params.set("sortOrder", options.sortOrder);
    if (options?.search) params.set("search", options.search);
    if (options?.filters) params.set("filters", JSON.stringify(options.filters));
    const qs = params.toString();
    return this.request(`/api/${this.basePath}${qs ? `?${qs}` : ""}`) as Promise<PaginatedResult<T>>;
  }

  async findById(id: string): Promise<T | null> {
    return this.request(`/api/${this.basePath}/${id}`) as Promise<T | null>;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.request(`/api/${this.basePath}?pageSize=10000`) as PaginatedResult<T>;
    return all.data.filter(predicate);
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    return this.request(`/api/${this.basePath}`, {
      method: "POST",
      body: JSON.stringify(data),
    }) as Promise<T>;
  }

  async update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T> {
    return this.request(`/api/${this.basePath}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }) as Promise<T>;
  }

  async delete(id: string): Promise<void> {
    await this.request(`/api/${this.basePath}/${id}`, { method: "DELETE" });
  }

  async count(): Promise<number> {
    const result = await this.request(`/api/${this.basePath}?pageSize=1`) as PaginatedResult<T>;
    return result.total;
  }

  async search(query: string): Promise<T[]> {
    const result = await this.request(`/api/${this.basePath}?search=${encodeURIComponent(query)}`) as PaginatedResult<T>;
    return result.data;
  }
}
