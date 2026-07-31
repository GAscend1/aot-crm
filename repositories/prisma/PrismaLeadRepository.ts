import { prisma } from "@/lib/prisma";
import type { Lead } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaLeadRepository extends PrismaRepositoryBase<Lead> {
  protected model = prisma.lead as unknown as PrismaModelLike;
  protected searchFields = ["firstName", "lastName", "companyName", "email", "phone"];
  protected include = { assignedTo: true };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const leadRepository = new PrismaLeadRepository();
