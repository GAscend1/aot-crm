export type LeadSource = "Website" | "Referral" | "LinkedIn" | "Conference" | "Cold Call" | "Other";

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";

export interface Lead {
  id: string;
  title: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  source: LeadSource;
  score: number;
  probability: number;
  owner: string;
  ownerId: string;
  expectedRevenue: number;
  expectedCloseDate: string;
  status: LeadStatus;
  notes: string;
  isFavorite: boolean;
  tags?: string[];
  convertedAt?: string;
  convertedCustomerId?: string;
  convertedContactId?: string;
  convertedOpportunityId?: string;
  createdAt: string;
  updatedAt: string;
}
