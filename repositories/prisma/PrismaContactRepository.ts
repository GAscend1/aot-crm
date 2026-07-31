import { prisma } from "@/lib/prisma";
import type { Contact } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaContactRepository extends PrismaRepositoryBase<Contact> {
  protected model = prisma.contact as unknown as PrismaModelLike;
  protected searchFields = ["firstName", "lastName", "email", "phone"];
  protected include = { company: true };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const contactRepository = new PrismaContactRepository();
