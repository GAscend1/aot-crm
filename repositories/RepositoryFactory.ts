import { ApiRepository } from "@/repositories/api/ApiRepository";
import type { IRepository } from "@/repositories/base/IRepository";

type EntityConstructor<T extends { id: string }> = (initial?: T[]) => IRepository<T>;

const entityMap: Record<string, string> = {
  customer: "customers",
  company: "companies",
  contact: "contacts",
  lead: "leads",
  opportunity: "opportunities",
  activity: "activities",
  ticket: "tickets",
  document: "documents",
  notification: "notifications",
  reminder: "reminders",
  calendar: "calendar",
  audit: "audit",
  assignment: "assignments",
  note: "notes",
};

/**
 * Client-side repository resolution.
 *
 * The CRM always persists to PostgreSQL. On the client this is achieved by
 * calling authenticated API routes; the API routes resolve the matching
 * server-side Prisma repository. No mock/static repository is ever selected.
 */
export function resolveRepository<T extends { id: string }>(): IRepository<T>;
export function resolveRepository<T extends { id: string }>(entityName: string): IRepository<T>;
export function resolveRepository<T extends { id: string }>(entityName?: string): IRepository<T> {
  const path = entityName ? entityMap[entityName] || entityName : "unknown";
  return new ApiRepository<T>(path);
}

export type { EntityConstructor };
