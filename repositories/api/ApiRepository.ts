import type { IRepository, PaginatedResult, QueryOptions } from "@/repositories/base/IRepository";

/**
 * Structured API error carrying the server's code, message, and field-level
 * errors so forms can render validation errors next to the offending inputs.
 */
export class ApiRequestError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export class ApiRepository<T extends { id: string }> implements IRepository<T> {
  constructor(private basePath: string) {}

  private async request(path: string, options?: RequestInit): Promise<unknown> {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let parsed: { error?: string; message?: string; code?: string; fieldErrors?: Record<string, string> } | null = null;
      try {
        parsed = text ? (JSON.parse(text) as { error?: string; message?: string; code?: string; fieldErrors?: Record<string, string> }) : null;
      } catch {
        parsed = null;
      }
      throw new ApiRequestError(
        res.status,
        parsed?.message ?? parsed?.error ?? `Request failed with status ${res.status}`,
        parsed?.code,
        parsed?.fieldErrors
      );
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
