"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "aot-crm:favorites:opportunity";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Favorites are stored locally per browser until a persistent column exists.
 * The toggle is instant and survives refresh.
 */
export function useOpportunityFavorite(opportunityId?: string) {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const favorite = opportunityId ? favorites.includes(opportunityId) : false;

  const toggle = useCallback(() => {
    if (!opportunityId) return;
    setFavorites((prev) => {
      const next = prev.includes(opportunityId)
        ? prev.filter((id) => id !== opportunityId)
        : [...prev, opportunityId];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — keep in-memory value */
      }
      return next;
    });
  }, [opportunityId]);

  return { favorite, toggle };
}
