import { z } from "zod";

export const emailOrEmpty = z.string().trim().optional().or(z.literal(""));

export const leadStatusValues = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
  "Converted",
  "Disqualified",
] as const;

export const pipelineStageValues = [
  "Qualification",
  "Discovery",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

export const activityTypeValues = [
  "Call",
  "Email",
  "Meeting",
  "Task",
  "Note",
  "Comment",
] as const;

export const activityStatusValues = ["Planned", "Completed", "Cancelled"] as const;

export const leadCreateSchema = z.object({
  title: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  contactName: z.string().optional(),
  company: z.string().optional(),
  email: emailOrEmpty,
  phone: z.string().optional(),
  source: z.string().optional(),
  score: z.coerce.number().min(0).max(999).optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  owner: z.string().optional(),
  ownerId: z.string().optional(),
  expectedRevenue: z.coerce.number().min(0).optional(),
  expectedCloseDate: z.string().nullable().optional(),
  status: z.enum(leadStatusValues).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const leadAssignSchema = z.object({
  assigneeId: z.string().optional().nullable(),
  assignToSelf: z.boolean().optional(),
});

export const leadDuplicateSchema = z.object({
  includeDocuments: z.boolean().optional().default(false),
});

export const leadConvertSchema = z.object({
  companyName: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  customerId: z.string().optional(),
  createOpportunity: z.boolean().optional().default(true),
  opportunityTitle: z.string().optional(),
  opportunityValue: z.coerce.number().optional(),
  opportunityCloseDate: z.string().nullable().optional(),
  opportunityStage: z.enum(pipelineStageValues).optional(),
  ownerId: z.string().optional(),
});

export const stageMoveSchema = z.object({
  stage: z.enum(pipelineStageValues),
});

export const activitySchema = z.object({
  type: z.enum(activityTypeValues).optional().default("Note"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  status: z.enum(activityStatusValues).optional().default("Planned"),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).optional().default("Normal"),
  dueDate: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  leadId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  ticketId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  createReminder: z.boolean().optional(),
  reminderDue: z.string().nullable().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: emailOrEmpty,
  phone: z.string().optional(),
  companyId: z.string().optional().nullable(),
  company: z.string().optional(),
  position: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Prospect", "Blocked"]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const companySchema = z
  .object({
    companyName: z.string().optional(),
    name: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
    email: emailOrEmpty,
    phone: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    employeeCount: z.coerce.number().optional(),
    size: z.string().optional(),
    revenue: z.string().optional(),
    status: z.string().optional(),
  })
  .refine((v) => (v.companyName ?? v.name ?? "").trim().length > 0, {
    message: "Company name is required",
    path: ["companyName"],
  });

export const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: emailOrEmpty,
  phone: z.string().optional(),
  position: z.string().optional(),
  companyId: z.string().optional().nullable(),
  company: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  role: z.string().nullable().optional(),
});

export const opportunitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  value: z.coerce.number().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  stage: z.enum(pipelineStageValues).optional(),
  stageId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  customer: z.string().optional(),
  companyId: z.string().optional().nullable(),
  company: z.string().optional(),
  contactId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  owner: z.string().optional(),
  expectedCloseDate: z.string().nullable().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  wonReason: z.string().nullable().optional(),
  lostReason: z.string().nullable().optional(),
  closedAt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const ticketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  customerId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  sla: z.string().optional(),
  requester: z.string().optional(),
  department: z.string().optional(),
  comments: z.coerce.number().optional(),
  attachments: z.coerce.number().optional(),
});

export const documentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.coerce.number().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
  status: z.string().optional(),
  url: z.string().optional(),
  storageKey: z.string().optional(),
  customerId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
});

export const reminderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueDate: z.string().min(1, "Due date is required"),
  completed: z.boolean().optional(),
  leadId: z.string().optional().nullable(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export const calendarSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  reminderMinutes: z.coerce.number().optional(),
  leadId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  participants: z.array(z.string()).optional(),
});

export const noteSchema = z.object({
  content: z.string().min(1, "Content is required"),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().nullable().optional(),
  status: z.string().optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
  category: z.string().optional(),
});

export const quoteItemSchema = z.object({
  name: z.string().optional().default(""),
  description: z.string().min(1),
  quantity: z.coerce.number().min(0).default(1),
  unitPrice: z.coerce.number().min(0).default(0),
});

export const quoteSchema = z.object({
  leadId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  currency: z.string().optional().default("USD"),
  validUntil: z.string().nullable().optional(),
  notes: z.string().optional(),
  taxRate: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).optional().default(0),
  items: z.array(quoteItemSchema).min(1, "At least one line item is required"),
});

export const quoteStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
});

export const invoiceCreateSchema = z.object({
  quoteId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  currency: z.string().optional().default("USD"),
  dueDate: z.string().nullable().optional(),
  notes: z.string().optional(),
  taxRate: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).optional().default(0),
  items: z.array(quoteItemSchema).optional(),
});

export const invoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"]),
  paidAt: z.string().nullable().optional(),
});

export const prospectingListSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const prospectSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: emailOrEmpty,
  phone: z.string().optional(),
  companyName: z.string().optional(),
  notes: z.string().optional(),
  ownerId: z.string().optional().nullable(),
  contacted: z.boolean().optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  listId: z.string().optional().nullable(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.string().optional(),
});

export const callOutcomeSchema = z.object({
  outcome: z.enum(["NoAnswer", "Voicemail", "Contacted", "Interested", "FollowUp", "NotInterested", "InvalidNumber"]),
  notes: z.string().optional(),
  followUpDate: z.string().nullable().optional(),
});

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  metric: z.string().min(1, "Metric is required"),
  target: z.coerce.number().min(0),
  period: z.string().optional().default("month"),
  userId: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.string().optional(),
});

export const automationConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.string().min(1),
  value: z.string().optional().nullable(),
});

export const automationActionSchema = z.object({
  type: z.enum([
    "notify",
    "assign",
    "addTag",
    "createTask",
    "createReminder",
    "updateStatus",
    "createActivity",
    "sendEmail",
  ]),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  graphDependent: z.boolean().optional().default(false),
});

export const automationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  enabled: z.boolean().optional(),
  triggerType: z.string().min(1, "Trigger is required"),
  conditions: z.array(automationConditionSchema).optional().default([]),
  actions: z.array(automationActionSchema).min(1, "At least one action is required"),
});

export const reportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["Sales", "Customer", "Pipeline", "Activity", "Financial", "Custom"]),
  type: z.enum(["Bar Chart", "Line Chart", "Pie Chart", "Table", "Summary"]),
  description: z.string().optional(),
  status: z.enum(["Draft", "Published", "Archived"]),
  lastRun: z.string().optional(),
});

export const adminUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum([
    "SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "SALES",
    "SUPPORT_MANAGER", "SUPPORT", "HR_MANAGER", "HR", "VIEWER",
  ]),
  department: z.string().optional().nullable(),
  team: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive", "Suspended"]),
});
