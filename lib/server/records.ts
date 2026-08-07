import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";
import { DEFAULT_ORG_ID } from "./tenant";

export interface AuditInput {
  entityType: string;
  entityId: string;
  action: string;
  description?: string;
  userId?: string | null;
  organizationId?: string | null;
  data?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        description: input.description,
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? DEFAULT_ORG_ID,
        data: input.data ? (input.data as object) : undefined,
        before: input.before ? (input.before as object) : undefined,
        after: input.after ? (input.after as object) : undefined,
      },
    });
  } catch (err) {
    console.error("logAudit failed:", err instanceof Error ? err.message : err);
  }
}

export interface NotificationInput {
  userId: string;
  type?: NotificationType;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  actionLink?: string;
}

export interface NotificationInput {
  userId: string;
  organizationId?: string | null;
  type?: NotificationType;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  actionLink?: string;
}

export async function createNotification(input: NotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId ?? DEFAULT_ORG_ID,
        type: input.type ?? "Info",
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
        actionLink: input.actionLink,
      },
    });
  } catch (err) {
    console.error("createNotification failed:", err instanceof Error ? err.message : err);
  }
}

export async function createActivity(input: {
  type: "Call" | "Email" | "Meeting" | "Task" | "Note" | "Comment";
  subject: string;
  description?: string;
  status?: "Planned" | "Completed" | "Cancelled";
  dueDate?: Date | null;
  leadId?: string | null;
  opportunityId?: string | null;
  customerId?: string | null;
  ticketId?: string | null;
  companyId?: string | null;
  assigneeId?: string | null;
  organizationId?: string | null;
}): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        type: input.type,
        subject: input.subject,
        description: input.description,
        status: input.status ?? "Completed",
        dueDate: input.dueDate,
        leadId: input.leadId ?? null,
        opportunityId: input.opportunityId ?? null,
        customerId: input.customerId ?? null,
        ticketId: input.ticketId ?? null,
        companyId: input.companyId ?? null,
        assigneeId: input.assigneeId ?? null,
        organizationId: input.organizationId ?? DEFAULT_ORG_ID,
        completedAt: input.status === "Completed" ? new Date() : null,
      },
    });
  } catch (err) {
    console.error("createActivity failed:", err instanceof Error ? err.message : err);
  }
}

export async function findOrCreateCompany(
  name: string,
  organizationId: string = DEFAULT_ORG_ID,
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await prisma.company.findFirst({
    where: {
      organizationId,
      companyName: { equals: trimmed, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.company.create({ data: { companyName: trimmed, organizationId } });
  return created.id;
}

export function leadDisplayName(lead: {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
}): string {
  const name = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
  return name || lead.companyName || "Untitled lead";
}
