import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

export type TicketPriority = "Low" | "Medium" | "High" | "Critical";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketSla = "4h" | "8h" | "24h" | "48h" | "1 week";

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  sla: TicketSla;
  assignee: string;
  requester: string;
  department: string;
  comments: number;
  attachments: number;
  createdAt: string;
  updatedAt: string;
}

export class TicketService extends BaseService<Ticket> {
  protected repository: IRepository<Ticket>;
  protected entityName = "ticket";

  constructor(repository: IRepository<Ticket>) {
    super();
    this.repository = repository;
  }
}
