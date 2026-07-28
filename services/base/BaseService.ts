import type { IRepository, PaginatedResult, QueryOptions } from "@/repositories/base/IRepository";

export abstract class BaseService<
  T extends { id: string },
  TCreate = Omit<T, "id" | "createdAt" | "updatedAt">,
  TUpdate = Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
> {
  protected abstract repository: IRepository<T>;

  async findAll(options?: QueryOptions): Promise<PaginatedResult<T>> {
    return this.repository.findAll(options);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async create(data: TCreate): Promise<T> {
    return this.repository.create(data as unknown as Omit<T, "id" | "createdAt" | "updatedAt">);
  }

  async update(id: string, data: TUpdate): Promise<T> {
    return this.repository.update(id, data as unknown as Partial<Omit<T, "id" | "createdAt" | "updatedAt">>);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async search(query: string): Promise<T[]> {
    return this.repository.search(query);
  }
}
