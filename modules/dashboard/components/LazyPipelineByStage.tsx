"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client-side lazy boundary for the recharts pipeline card. Keeps the heavy
 * recharts bundle out of the dashboard's initial chunk; it loads only when
 * this card mounts.
 */
export const LazyPipelineByStage = dynamic(
  () => import("./PipelineByStage").then((m) => m.PipelineByStage),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
  },
);
