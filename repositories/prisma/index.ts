import type { IRepository } from "@/repositories/base/IRepository";
import { customerRepository } from "./PrismaCustomerRepository";
import { companyRepository } from "./PrismaCompanyRepository";
import { contactRepository } from "./PrismaContactRepository";
import { leadRepository } from "./PrismaLeadRepository";
import { opportunityRepository } from "./PrismaOpportunityRepository";
import { activityRepository } from "./PrismaActivityRepository";
import { calendarRepository } from "./PrismaCalendarRepository";
import { reminderRepository } from "./PrismaReminderRepository";
import { notificationRepository } from "./PrismaNotificationRepository";
import { ticketRepository } from "./PrismaTicketRepository";
import { documentRepository } from "./PrismaDocumentRepository";
import { auditRepository } from "./PrismaAuditRepository";
import { assignmentRepository } from "./PrismaAssignmentRepository";
import { noteRepository } from "./PrismaNoteRepository";

export * from "./PrismaRepositoryBase";
export * from "./PrismaCustomerRepository";
export * from "./PrismaCompanyRepository";
export * from "./PrismaContactRepository";
export * from "./PrismaLeadRepository";
export * from "./PrismaOpportunityRepository";
export * from "./PrismaActivityRepository";
export * from "./PrismaCalendarRepository";
export * from "./PrismaReminderRepository";
export * from "./PrismaNotificationRepository";
export * from "./PrismaTicketRepository";
export * from "./PrismaDocumentRepository";
export * from "./PrismaAuditRepository";
export * from "./PrismaAssignmentRepository";
export * from "./PrismaNoteRepository";

export interface EntityRepositoryRegistry {
  customer: IRepository<{ id: string }>;
  company: IRepository<{ id: string }>;
  contact: IRepository<{ id: string }>;
  lead: IRepository<{ id: string }>;
  opportunity: IRepository<{ id: string }>;
  activity: IRepository<{ id: string }>;
  calendar: IRepository<{ id: string }>;
  reminder: IRepository<{ id: string }>;
  notification: IRepository<{ id: string }>;
  ticket: IRepository<{ id: string }>;
  document: IRepository<{ id: string }>;
  audit: IRepository<{ id: string }>;
  assignment: IRepository<{ id: string }>;
  note: IRepository<{ id: string }>;
}

export const prismaRepositories: Record<keyof EntityRepositoryRegistry, IRepository<{ id: string }>> = {
  customer: customerRepository,
  company: companyRepository,
  contact: contactRepository,
  lead: leadRepository,
  opportunity: opportunityRepository,
  activity: activityRepository,
  calendar: calendarRepository,
  reminder: reminderRepository,
  notification: notificationRepository,
  ticket: ticketRepository,
  document: documentRepository,
  audit: auditRepository,
  assignment: assignmentRepository,
  note: noteRepository,
};
