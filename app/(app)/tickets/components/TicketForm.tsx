"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Ticket, TicketPriority, TicketStatus, TicketSla } from "../types";

interface TicketFormProps {
  initialData?: Ticket;
  onSubmit: (data: Ticket) => Promise<void> | void;
  onCancel: () => void;
}

export function TicketForm({
  initialData,
  onSubmit,
  onCancel,
}: TicketFormProps) {
  const [subject, setSubject] = useState(initialData?.subject ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [priority, setPriority] = useState<TicketPriority>(
    initialData?.priority ?? "Medium"
  );
  const [status, setStatus] = useState<TicketStatus>(
    initialData?.status ?? "Open"
  );
  const [sla, setSla] = useState<TicketSla>(initialData?.sla ?? "24h");
  const [assignee, setAssignee] = useState(initialData?.assignee ?? "");
  const [requester, setRequester] = useState(initialData?.requester ?? "");
  const [department, setDepartment] = useState(initialData?.department ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        id: initialData?.id ?? crypto.randomUUID(),
        subject,
        description,
        priority,
        status,
        sla,
        assignee,
        requester,
        department,
        comments: initialData?.comments ?? 0,
        attachments: initialData?.attachments ?? 0,
        createdAt:
          initialData?.createdAt ?? new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Subject
        </label>

        <Input
          placeholder="Ticket subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Description
        </label>

        <textarea
          className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Describe the issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Priority
          </label>

          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TicketPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as TicketStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            SLA
          </label>

          <Select
            value={sla}
            onValueChange={(v) => setSla(v as TicketSla)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="8h">8h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="48h">48h</SelectItem>
              <SelectItem value="1 week">1 week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Department
          </label>

          <Select
            value={department}
            onValueChange={(v) => setDepartment(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Assignee
          </label>

          <Input
            placeholder="Assignee name"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Requester
          </label>

          <Input
            placeholder="Requester name"
            value={requester}
            onChange={(e) => setRequester(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>

        <Button onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Ticket"}
        </Button>
      </div>
    </div>
  );
}
