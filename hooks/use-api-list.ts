"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client/api";

/**
 * Fetch a paginated API list with dedupe + caching via TanStack Query.
 * All callers of the same `path` share one query (e.g. the module stats
 * components that each request `?pageSize=1000`).
 */
export function useApiList<T = Record<string, unknown>>(path: string): {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const query = useQuery<T[]>({
    queryKey: ["api-list", path],
    queryFn: async () => {
      const body = await fetchJson<{ data?: T[] }>(path);
      return Array.isArray(body?.data) ? (body.data as T[]) : [];
    },
  });

  return {
    data: query.data ?? [],
    loading: query.isPending && !query.isPlaceholderData,
    error: query.isError ? "Failed to load data. Please try again." : null,
    refresh: () => void query.refetch(),
  };
}
