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
  Document,
  DocumentCategory,
  DocumentStatus,
  DocumentType,
} from "../types";

interface DocumentFormProps {
  initialData?: Document;
  onSubmit: (data: Document) => void;
  onCancel: () => void;
}

const categories: DocumentCategory[] = [
  "Contract",
  "Proposal",
  "Report",
  "Invoice",
  "Marketing",
  "Other",
];

const types: DocumentType[] = ["PDF", "DOCX", "XLSX", "PPTX", "Image", "Other"];

export function DocumentForm({
  initialData,
  onSubmit,
  onCancel,
}: DocumentFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState<DocumentCategory>(
    initialData?.category ?? "Other"
  );
  const [type, setType] = useState<DocumentType>(
    initialData?.type ?? "PDF"
  );
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [tags, setTags] = useState(initialData?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<DocumentStatus>(
    initialData?.status ?? "Active"
  );

  function handleSubmit() {
    onSubmit({
      id: initialData?.id ?? crypto.randomUUID(),
      name,
      category,
      type,
      size: initialData?.size ?? "0 KB",
      uploadDate: initialData?.uploadDate ?? new Date().toISOString().split("T")[0],
      uploadedBy: initialData?.uploadedBy ?? "Current User",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      version: initialData?.version ?? "v1.0",
      description,
      status,
      createdAt: initialData?.createdAt ?? new Date().toISOString().split("T")[0],
      updatedAt: initialData?.updatedAt ?? new Date().toISOString().split("T")[0],
    });
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Document Name
        </label>

        <Input
          placeholder="Document name"
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
            onValueChange={(v) => setCategory(v as DocumentCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
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
            onValueChange={(v) => setType(v as DocumentType)}
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
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Document description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Tags (comma separated)
        </label>

        <Input
          placeholder="tag1, tag2, tag3"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Status
        </label>

        <Select
          value={status}
            onValueChange={(v) => setStatus(v as DocumentStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button onClick={handleSubmit}>
          {isEditing ? "Save Changes" : "Upload Document"}
        </Button>
      </div>
    </div>
  );
}