import { prisma } from "@/lib/prisma";
import type { Opportunity } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaOpportunityRepository extends PrismaRepositoryBase<Opportunity> {
  protected model = prisma.opportunity as unknown as PrismaModelLike;
  protected searchFields = ["title"];
  protected include = { customer: true, stage: true, owner: true };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const opportunityRepository = new PrismaOpportunityRepository();
