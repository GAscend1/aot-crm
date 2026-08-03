"use client";

import { useSyncExternalStore } from "react";

const FALLBACK_PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];

export interface ChartPalette {
  palette: string[];
  primary: string;
}

const SERVER_SNAPSHOT: ChartPalette = {
  palette: FALLBACK_PALETTE,
  primary: FALLBACK_PALETTE[0],
};

let cachedSnapshot: ChartPalette | null = null;

function computeSnapshot(): ChartPalette {
  if (typeof document === "undefined") return SERVER_SNAPSHOT;
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const value = styles.getPropertyValue(name).trim();
    return value ? value : fallback;
  };
  const palette = [1, 2, 3, 4, 5, 6].map((i) =>
    read(`--chart-${i}`, FALLBACK_PALETTE[i - 1])
  );
  return { palette, primary: palette[0] };
}

function getSnapshot(): ChartPalette {
  const next = computeSnapshot();
  if (
    !cachedSnapshot ||
    cachedSnapshot.primary !== next.primary ||
    cachedSnapshot.palette.length !== next.palette.length ||
    cachedSnapshot.palette.some((color, i) => color !== next.palette[i])
  ) {
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

function subscribe(callback: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  return () => observer.disconnect();
}

export function useChartPalette(): ChartPalette {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
