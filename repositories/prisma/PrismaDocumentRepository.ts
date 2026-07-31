import { prisma } from "@/lib/prisma";
import type { Document } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaDocumentRepository extends PrismaRepositoryBase<Document> {
  protected model = prisma.document as unknown as PrismaModelLike;
  protected searchFields = ["name", "type", "category", "description"];
  protected include = {
    customer: { select: { id: true, name: true } },
    opportunity: { select: { id: true, title: true } },
    lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
    company: { select: { id: true, companyName: true } },
    uploadedBy: { select: { id: true, name: true } },
  };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const documentRepository = new PrismaDocumentRepository();
