"use client";

import { use } from "react";
import { Mail, Clock } from "lucide-react";
import { RecordDetail } from "@/components/enterprise/RecordDetail";
import { ticketService } from "@/services/index";
import type { Ticket } from "@/services/ticket.service";

const statusColors: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Resolved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <RecordDetail<Ticket>
      id={id}
      service={ticketService}
      backHref="/tickets"
      title="Ticket"
      getTitle={(t) => t.subject}
      getDescription={(t) => `${t.requester} · ${t.department}`}
      renderFields={(t) => [
        { label: "Requester", value: t.requester },
        { label: "Assignee", value: t.assignee },
        { label: "Department", value: t.department },
        { label: "SLA", value: t.sla },
        { label: "Comments", value: t.comments },
        { label: "Attachments", value: t.attachments },
        { label: "Description", value: t.description },
      ]}
      renderStatus={(t) => ({
        label: "Status",
        value: (
          <div className="space-y-3">
            <div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[t.status] || ""}`}>
                {t.status}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Priority</p>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[t.priority] || ""}`}>
                {t.priority}
              </span>
            </div>
          </div>
        ),
      })}
      quickActions={() => [
        { label: "Send Email", icon: Mail, onClick: () => {} },
        { label: "Update Status", icon: Clock, onClick: () => {} },
      ]}
    />
  );
}
