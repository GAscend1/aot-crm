"use client";

import { useState, useEffect, useCallback } from "react";

export function useApiList<T = Record<string, unknown>>(path: string): {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const body = await res.json();
        if (!cancelled)
          setData(Array.isArray(body?.data) ? (body.data as T[]) : []);
      } catch {
        if (!cancelled) setError("Failed to load data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [path, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { data, loading, error, refresh };
}
