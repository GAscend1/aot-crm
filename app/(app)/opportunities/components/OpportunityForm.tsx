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
import { useAsyncSubmit } from "@/components/common/use-async-submit";
import { FormErrorBanner, FormFieldError } from "@/components/common/FormError";

import { Opportunity, OpportunityStatus, Stage } from "../types";

interface OpportunityFormProps {
  initialData?: Opportunity;
  /** Async save. Resolve on success; throw (or reject) on failure to stay open with errors. */
  onSubmit: (data: Opportunity) => Promise<void>;
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

  const { saving, error, fieldErrors, submit } = useAsyncSubmit(
    onSubmit as (data: never) => Promise<unknown>,
  );

  async function handleSubmit() {
    await submit({
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
    } as never);
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <FormErrorBanner message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-title">
            Title
          </label>

          <Input
            id="opportunity-title"
            placeholder="Opportunity title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!fieldErrors.title}
          />
          <FormFieldError message={fieldErrors.title} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-customer">
            Customer
          </label>

          <Input
            id="opportunity-customer"
            placeholder="Customer name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-value">
            Value ($)
          </label>

          <Input
            id="opportunity-value"
            type="number"
            placeholder="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-stage">
            Stage
          </label>

          <Select
            value={stage}
            onValueChange={(v) => setStage(v as Stage)}
          >
            <SelectTrigger id="opportunity-stage">
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
          <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-probability">
            Probability (%)
          </label>

          <Input
            id="opportunity-probability"
            type="number"
            placeholder="0"
            min={0}
            max={100}
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-close">
            Expected Close Date
          </label>

          <Input
            id="opportunity-close"
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-owner">
            Owner
          </label>

          <Input
            id="opportunity-owner"
            placeholder="Owner name"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-status">
            Status
          </label>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as OpportunityStatus)}
          >
            <SelectTrigger id="opportunity-status">
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
        <label className="text-xs font-medium text-muted-foreground" htmlFor="opportunity-notes">
          Notes
        </label>

        <Input
          id="opportunity-notes"
          placeholder="Additional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>

        <Button onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Opportunity"}
        </Button>
      </div>
    </div>
  );
}
