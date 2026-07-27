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

import {
  Activity,
  ActivityStatus,
  ActivityType,
  RelatedType,
} from "../types";

interface ActivityFormProps {
  initialData?: Activity;
  onSubmit: (data: Activity) => void;
  onCancel: () => void;
}

const types: ActivityType[] = [
  "Meeting",
  "Call",
  "Email",
  "Task",
  "Reminder",
];

const statuses: ActivityStatus[] = [
  "Planned",
  "In Progress",
  "Completed",
  "Cancelled",
];

const relatedTypes: RelatedType[] = [
  "lead",
  "opportunity",
  "customer",
  "ticket",
];

export function ActivityForm({
  initialData,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const [type, setType] = useState<ActivityType>(
    initialData?.type ?? "Meeting"
  );
  const [subject, setSubject] = useState(initialData?.subject ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [date, setDate] = useState(initialData?.date ?? "");
  const [time, setTime] = useState(initialData?.time ?? "");
  const [owner, setOwner] = useState(initialData?.owner ?? "");
  const [status, setStatus] = useState<ActivityStatus>(
    initialData?.status ?? "Planned"
  );
  const [relatedTo, setRelatedTo] = useState(initialData?.relatedTo ?? "");
  const [relatedType, setRelatedType] = useState<RelatedType>(
    initialData?.relatedType ?? "lead"
  );
  const [reminder, setReminder] = useState(initialData?.reminder ?? "");

  function handleSubmit() {
    onSubmit({
      id: initialData?.id ?? crypto.randomUUID(),
      type,
      subject,
      description,
      date,
      time,
      owner,
      status,
      relatedTo,
      relatedType,
      reminder,
      createdAt:
        initialData?.createdAt ?? new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    });
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Type
          </label>

          <Select
            value={type}
            onValueChange={(v) => setType(v as ActivityType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ActivityStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Subject
        </label>

        <Input
          placeholder="Activity subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Description
        </label>

        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Date
          </label>

          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Time
          </label>

          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Owner
        </label>

        <Input
          placeholder="Assigned to"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Related To
          </label>

          <Input
            placeholder="Entity name"
            value={relatedTo}
            onChange={(e) => setRelatedTo(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Related Type
          </label>

          <Select
            value={relatedType}
            onValueChange={(v) => setRelatedType(v as RelatedType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {relatedTypes.map((rt) => (
                <SelectItem key={rt} value={rt}>
                  {rt.charAt(0).toUpperCase() + rt.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Reminder
        </label>

        <Input
          placeholder="e.g. 15 minutes before"
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button onClick={handleSubmit}>
          {isEditing ? "Save Changes" : "Create Activity"}
        </Button>
      </div>
    </div>
  );
}
