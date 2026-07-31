import { prisma } from "@/lib/prisma";
import type { Reminder } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaReminderRepository extends PrismaRepositoryBase<Reminder> {
  protected model = prisma.reminder as unknown as PrismaModelLike;
  protected searchFields = ["title"];
  protected include = { user: { select: { id: true, name: true } } };
  protected defaultOrder = { dueDate: "asc" as const };
}

export const reminderRepository = new PrismaReminderRepository();
