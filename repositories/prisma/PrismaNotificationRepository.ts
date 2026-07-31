import { prisma } from "@/lib/prisma";
import type { Notification } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaNotificationRepository extends PrismaRepositoryBase<Notification> {
  protected model = prisma.notification as unknown as PrismaModelLike;
  protected searchFields = ["title", "message"];
  protected include = { user: { select: { id: true, name: true } } };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const notificationRepository = new PrismaNotificationRepository();
