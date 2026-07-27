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
