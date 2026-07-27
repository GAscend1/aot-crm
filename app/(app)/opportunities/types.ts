export type Stage =
  | "Discovery"
  | "Qualification"
  | "Proposal"
  | "Negotiation"
  | "Closed Won"
  | "Closed Lost";

export type OpportunityStatus = "Open" | "Won" | "Lost";

export interface Opportunity {
  id: string;
  title: string;
  customer: string;
  value: number;
  stage: Stage;
  probability: number;
  expectedCloseDate: string;
  owner: string;
  notes: string;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}

export const stageColors: Record<Stage, string> = {
  Discovery: "bg-blue-100 text-blue-700",
  Qualification: "bg-purple-100 text-purple-700",
  Proposal: "bg-amber-100 text-amber-700",
  Negotiation: "bg-orange-100 text-orange-700",
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
};
