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

import { Report, ReportCategory, ReportStatus, ReportType } from "../types";

interface ReportFormProps {
  initialData?: Report;
  onSubmit: (data: Report) => void;
  onCancel: () => void;
}

const categories: ReportCategory[] = [
  "Sales",
  "Customer",
  "Pipeline",
  "Activity",
  "Financial",
  "Custom",
];

const types: ReportType[] = [
  "Bar Chart",
  "Line Chart",
  "Pie Chart",
  "Table",
  "Summary",
];

const statuses: ReportStatus[] = ["Draft", "Published", "Archived"];

export function ReportForm({
  initialData,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState<ReportCategory>(
    initialData?.category ?? "Sales"
  );
  const [type, setType] = useState<ReportType>(
    initialData?.type ?? "Bar Chart"
  );
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [status, setStatus] = useState<ReportStatus>(
    initialData?.status ?? "Draft"
  );

  function handleSubmit() {
    onSubmit({
      id: initialData?.id ?? crypto.randomUUID(),
      name,
      category,
      type,
      description,
      createdBy: initialData?.createdBy ?? "Current User",
      createdAt:
        initialData?.createdAt ?? new Date().toISOString().split("T")[0],
      lastRun: initialData?.lastRun ?? new Date().toISOString().split("T")[0],
      status,
    });
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Report Name
        </label>

        <Input
          placeholder="Report name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Category
          </label>

          <Select
            value={category}
            onValueChange={(v) => setCategory(v as ReportCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Type
          </label>

          <Select
            value={type}
            onValueChange={(v) => setType(v as ReportType)}
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
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Description
        </label>

        <textarea
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Describe the report purpose..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Status
        </label>

        <Select
          value={status}
            onValueChange={(v) => setStatus(v as ReportStatus)}
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

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button onClick={handleSubmit}>
          {isEditing ? "Save Changes" : "Create Report"}
        </Button>
      </div>
    </div>
  );
}
