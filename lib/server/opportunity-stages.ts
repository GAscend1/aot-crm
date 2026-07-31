import type { PipelineStageName } from "@/generated/prisma/client";

export function uiStageToDb(stage: string): PipelineStageName | undefined {
  const map: Record<string, PipelineStageName> = {
    Qualification: "Qualification",
    Discovery: "Discovery",
    Proposal: "Proposal",
    Negotiation: "Negotiation",
    "Closed Won": "ClosedWon",
    "Closed Lost": "ClosedLost",
  };
  return map[stage];
}

export function dbStageToUi(stage: string): string {
  return stage === "ClosedWon" ? "Closed Won" : stage === "ClosedLost" ? "Closed Lost" : stage;
}
