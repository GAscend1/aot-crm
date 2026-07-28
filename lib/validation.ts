import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  position: z.string().optional().default(""),
  country: z.string().optional().default(""),
  city: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive", "Prospect", "Blocked"]).default("Active"),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().default(""),
});

export const companySchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional().default(""),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).default("11-50"),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  website: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  employeeCount: z.number().optional().default(0),
  revenue: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const leadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().optional().default(""),
  contactName: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  source: z.enum(["Website", "Referral", "LinkedIn", "Conference", "Cold Call", "Other"]).default("Website"),
  score: z.number().min(0).max(100).default(0),
  probability: z.number().min(0).max(100).default(0),
  owner: z.string().optional().default(""),
  expectedRevenue: z.number().optional().default(0),
  status: z.enum(["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]).default("New"),
  notes: z.string().optional().default(""),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  position: z.string().optional().default(""),
  department: z.string().optional().default(""),
  mobile: z.string().optional().default(""),
  country: z.string().optional().default(""),
  city: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  tags: z.array(z.string()).default([]),
});

export const opportunitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  customer: z.string().optional().default(""),
  company: z.string().optional().default(""),
  value: z.number().optional().default(0),
  stage: z.enum(["Qualification", "Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]).default("Qualification"),
  probability: z.number().min(0).max(100).default(0),
  owner: z.string().optional().default(""),
  expectedCloseDate: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  tags: z.array(z.string()).default([]),
});
