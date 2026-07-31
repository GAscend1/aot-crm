import { prisma } from "@/lib/prisma";
import type { Note } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaNoteRepository extends PrismaRepositoryBase<Note> {
  protected model = prisma.note as unknown as PrismaModelLike;
  protected searchFields = ["content"];
  protected include = { author: { select: { id: true, name: true } } };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const noteRepository = new PrismaNoteRepository();
