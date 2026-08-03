export const OPPORTUNITY_STAGES = [
  "Discovery",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export interface StageConfig {
  dot: string;
  pill: string;
}

export const stageConfig: Record<OpportunityStage, StageConfig> = {
  Discovery: {
    dot: "bg-[color:var(--info)]",
    pill: "bg-info-soft text-[color:var(--info)] ring-info/25",
  },
  Qualification: {
    dot: "bg-[color:var(--chart-5)]",
    pill: "bg-[color:var(--chart-5)]/[0.12] text-[color:var(--chart-5)] ring-[color:var(--chart-5)]/25",
  },
  Proposal: {
    dot: "bg-[color:var(--chart-3)]",
    pill: "bg-[color:var(--chart-3)]/[0.12] text-[color:var(--chart-3)] ring-[color:var(--chart-3)]/25",
  },
  Negotiation: {
    dot: "bg-[color:var(--warning)]",
    pill: "bg-warning-soft text-[color:var(--warning)] ring-warning/25",
  },
  "Closed Won": {
    dot: "bg-[color:var(--success)]",
    pill: "bg-success-soft text-[color:var(--success)] ring-success/25",
  },
  "Closed Lost": {
    dot: "bg-[color:var(--danger)]",
    pill: "bg-danger-soft text-[color:var(--danger)] ring-danger/25",
  },
};

const fallbackConfig: StageConfig = {
  dot: "bg-muted-foreground/60",
  pill: "bg-muted text-muted-foreground ring-border",
};

export const stageDotVar: Record<OpportunityStage, string> = {
  Discovery: "var(--info)",
  Qualification: "var(--chart-5)",
  Proposal: "var(--chart-3)",
  Negotiation: "var(--warning)",
  "Closed Won": "var(--success)",
  "Closed Lost": "var(--danger)",
};

export function getStageConfig(stage?: string | null): StageConfig {
  if (stage && stage in stageConfig) return stageConfig[stage as OpportunityStage];
  return fallbackConfig;
}

export function isOpportunityStage(value: string): value is OpportunityStage {
  return (OPPORTUNITY_STAGES as readonly string[]).includes(value);
}
