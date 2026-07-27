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

import { Opportunity, OpportunityStatus, Stage } from "../types";

interface OpportunityFormProps {
  initialData?: Opportunity;
  onSubmit: (data: Opportunity) => void;
  onCancel: () => void;
}

const stages: Stage[] = [
  "Discovery",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const statuses: OpportunityStatus[] = ["Open", "Won", "Lost"];

export function OpportunityForm({
  initialData,
  onSubmit,
  onCancel,
}: OpportunityFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [customer, setCustomer] = useState(initialData?.customer ?? "");
  const [value, setValue] = useState(
    initialData?.value.toString() ?? ""
  );
  const [stage, setStage] = useState<Stage>(initialData?.stage ?? "Discovery");
  const [probability, setProbability] = useState(
    initialData?.probability.toString() ?? ""
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    initialData?.expectedCloseDate ?? ""
  );
  const [owner, setOwner] = useState(initialData?.owner ?? "");
  const [status, setStatus] = useState<OpportunityStatus>(
    initialData?.status ?? "Open"
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  function handleSubmit() {
    onSubmit({
      id: initialData?.id ?? crypto.randomUUID(),
      title,
      customer,
      value: Number(value),
      stage,
      probability: Number(probability),
      expectedCloseDate,
      owner,
      status,
      notes,
      createdAt:
        initialData?.createdAt ??
        new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    });
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Title
          </label>

          <Input
            placeholder="Opportunity title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Customer
          </label>

          <Input
            placeholder="Customer name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Value ($)
          </label>

          <Input
            type="number"
            placeholder="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Stage
          </label>

          <Select
            value={stage}
            onValueChange={(v) => setStage(v as Stage)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Probability (%)
          </label>

          <Input
            type="number"
            placeholder="0"
            min={0}
            max={100}
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Expected Close Date
          </label>

          <Input
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Owner
          </label>

          <Input
            placeholder="Owner name"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as OpportunityStatus)}
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
          Notes
        </label>

        <Input
          placeholder="Additional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button onClick={handleSubmit}>
          {isEditing ? "Save Changes" : "Create Opportunity"}
        </Button>
      </div>
    </div>
  );
}
