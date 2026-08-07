"use client";

import { useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { FileUp, Loader2, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";

const documentTypes = [
  "Proposal",
  "Contract",
  "NDA",
  "Scope of Work",
  "Pricing Sheet",
  "Presentation",
  "Meeting Notes",
  "Technical Document",
  "Email Attachment",
  "Other",
];

interface UploadEntityDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  /** API field name: posts companyId / customerId / opportunityId / leadId. */
  entityKind: "company" | "customer" | "opportunity" | "lead";
  entityId: string;
  entityLabel: string;
  onUploaded?: () => void;
}

export function UploadEntityDocumentDialog({
  open,
  onClose,
  entityKind,
  entityId,
  entityLabel,
  onUploaded,
}: UploadEntityDocumentDialogProps) {
  const { success, error: showError } = useToastContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState("Proposal");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      showError("Error", "Choose a file to upload.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", documentType);
      const res = await fetch(`/api/documents/upload?entityKind=${entityKind}&entityId=${encodeURIComponent(entityId)}`, {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Upload failed");
      success("Document uploaded", `${file.name} was linked to ${entityLabel}.`);
      onUploaded?.();
      onClose();
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-md flex-col rounded-xl border bg-surface-raised shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileUp className="h-4 w-4 text-[color:var(--primary)]" />
                Upload Document
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{entityLabel}</p>
                <p className="text-xs text-muted-foreground">This document will be linked to the record.</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {documentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
              >
                <FileText className="h-8 w-8" />
                <span>{fileName || "Click to choose a file"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFileName(file.name);
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <Button variant="outline" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={() => void handleUpload()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
