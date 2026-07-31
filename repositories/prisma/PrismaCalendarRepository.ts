import { prisma } from "@/lib/prisma";
import type { CalendarEvent } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaCalendarRepository extends PrismaRepositoryBase<CalendarEvent> {
  protected model = prisma.calendarEvent as unknown as PrismaModelLike;
  protected searchFields = ["title", "location", "description"];
  protected include = { user: { select: { id: true, name: true, email: true } } };
  protected defaultOrder = { startTime: "asc" as const };
}

export const calendarRepository = new PrismaCalendarRepository();
