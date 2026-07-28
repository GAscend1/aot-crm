export interface QueryOptions {
  search?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IRepository<T extends { id: string }> {
  findAll(options?: QueryOptions): Promise<PaginatedResult<T>>;
  findById(id: string): Promise<T | null>;
  findMany(predicate: (item: T) => boolean): Promise<T[]>;
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  search(query: string): Promise<T[]>;
}
