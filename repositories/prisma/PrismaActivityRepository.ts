import { prisma } from "@/lib/prisma";
import type { Activity } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaActivityRepository extends PrismaRepositoryBase<Activity> {
  protected model = prisma.activity as unknown as PrismaModelLike;
  protected searchFields = ["subject", "description"];
  protected include = {
    lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
    opportunity: { select: { id: true, title: true } },
    customer: { select: { id: true, name: true } },
    assignee: { select: { id: true, name: true } },
  };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const activityRepository = new PrismaActivityRepository();
