import { getStageConfig } from "@/lib/pipeline-stages";

/**
 * Tailwind classes for an opportunity-stage pill, reusing the canonical
 * pipeline stage config. Falls back to a neutral pill for unknown stages.
 */
export function stagePillClasses(stage?: string | null): string {
  return getStageConfig(stage).pill;
}
