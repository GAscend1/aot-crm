import { prisma } from "@/lib/prisma";
import type { Assignment } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaAssignmentRepository extends PrismaRepositoryBase<Assignment> {
  protected model = prisma.assignment as unknown as PrismaModelLike;
  protected searchFields = ["title", "description"];
  protected include = {
    assignee: { select: { id: true, name: true } },
    assignedBy: { select: { id: true, name: true } },
  };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const assignmentRepository = new PrismaAssignmentRepository();
