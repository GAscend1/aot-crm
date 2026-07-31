import { prisma } from "@/lib/prisma";
import type { Company } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaCompanyRepository extends PrismaRepositoryBase<Company> {
  protected model = prisma.company as unknown as PrismaModelLike;
  protected searchFields = ["companyName", "email", "phone", "industry", "city", "country"];
  protected defaultOrder = { createdAt: "desc" as const };
}

export const companyRepository = new PrismaCompanyRepository();
