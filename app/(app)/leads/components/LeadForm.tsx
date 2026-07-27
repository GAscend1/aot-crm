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

import { Lead, LeadSource, LeadStatus } from "../types";

interface LeadFormProps {
  initialData?: Lead;
  onSubmit: (data: Lead) => void;
  onCancel: () => void;
}

const sourceOptions: LeadSource[] = [
  "Website",
  "Referral",
  "LinkedIn",
  "Conference",
  "Cold Call",
  "Other",
];

const statusOptions: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

export function LeadForm({
  initialData,
  onSubmit,
  onCancel,
}: LeadFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [company, setCompany] = useState(initialData?.company ?? "");
  const [contactName, setContactName] = useState(initialData?.contactName ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [source, setSource] = useState<LeadSource>(initialData?.source ?? "Website");
  const [score, setScore] = useState(initialData?.score.toString() ?? "");
  const [probability, setProbability] = useState(initialData?.probability.toString() ?? "");
  const [owner, setOwner] = useState(initialData?.owner ?? "");
  const [expectedRevenue, setExpectedRevenue] = useState(
    initialData?.expectedRevenue.toString() ?? ""
  );
  const [status, setStatus] = useState<LeadStatus>(
    initialData?.status ?? "New"
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  function handleSubmit() {
    onSubmit({
      id: initialData?.id ?? crypto.randomUUID(),
      title,
      company,
      contactName,
      email,
      phone,
      source,
      score: Number(score),
      probability: Number(probability),
      owner,
      expectedRevenue: Number(expectedRevenue),
      status,
      notes,
      createdAt: initialData?.createdAt ?? new Date().toISOString().split("T")[0],
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
            placeholder="Lead title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Company
          </label>

          <Input
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Contact Name
          </label>

          <Input
            placeholder="Full name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Email
          </label>

          <Input
            type="email"
            placeholder="email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Phone
          </label>

          <Input
            placeholder="+1 555-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Source
          </label>

          <Select value={source} onValueChange={(v) => setSource(v as LeadSource)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {sourceOptions.map((s) => (
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
            Score (0-100)
          </label>

          <Input
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Probability (0-100)
          </label>

          <Input
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Expected Revenue
          </label>

          <Input
            type="number"
            placeholder="0"
            value={expectedRevenue}
            onChange={(e) => setExpectedRevenue(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Status
        </label>

        <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Notes
        </label>

        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button onClick={handleSubmit}>
          {isEditing ? "Save Changes" : "Create Lead"}
        </Button>
      </div>
    </div>
  );
}
