import { prisma } from "@/lib/prisma";
import type { AuditLog } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaAuditRepository extends PrismaRepositoryBase<AuditLog> {
  protected model = prisma.auditLog as unknown as PrismaModelLike;
  protected searchFields = ["action", "description", "entityType"];
  protected include = { user: { select: { id: true, name: true } } };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const auditRepository = new PrismaAuditRepository();
