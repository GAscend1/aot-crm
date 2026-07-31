import { prisma } from "@/lib/prisma";
import type { Ticket } from "@/generated/prisma/client";
import {
  PrismaRepositoryBase,
  type PrismaModelLike,
} from "./PrismaRepositoryBase";

export class PrismaTicketRepository extends PrismaRepositoryBase<Ticket> {
  protected model = prisma.ticket as unknown as PrismaModelLike;
  protected searchFields = ["title", "description", "requester"];
  protected include = { customer: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } };
  protected defaultOrder = { createdAt: "desc" as const };
}

export const ticketRepository = new PrismaTicketRepository();
