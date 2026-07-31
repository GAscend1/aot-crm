import { prisma } from "@/lib/prisma";
import type { Customer } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaCustomerRepository extends PrismaRepositoryBase<Customer> {
  protected model = prisma.customer as unknown as PrismaModelLike;
  protected searchFields = ["name", "email", "phone"];
  protected include = { company: true };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const customerRepository = new PrismaCustomerRepository();
