"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, FileUp, Download, Image, FileSpreadsheet, File as FileIcon, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useToastContext } from "@/app/(app)/AppProviders";

type LeadAttachment = {
  id: string;
  name: string;
  mimeType: string | null;
  size: number | null;
  category: string | null;
  createdAt: string;
  uploadedByName: string | null;
};

const categoryColors: Record<string, string> = {
  PDF: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
  Image: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  XLSX: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
  DOCX: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  PPTX: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
};

export function LeadDocumentsTab({ leadId }: { leadId: string }) {
  const [documents, setDocuments] = useState<LeadAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: showError } = useToastContext();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/leads/${leadId}/attachments`);
        if (!res.ok) throw new Error("Failed to load attachments");
        const body = (await res.json()) as { data: LeadAttachment[] };
        if (!cancelled) setDocuments(body.data);
      } catch {
        if (!cancelled) setDocuments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/leads/${leadId}/attachments`, {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => ({}))) as Partial<LeadAttachment> & { error?: string };
      if (!res.ok) {
        throw new Error(body.error || "Failed to upload");
      }
      setDocuments((prev) => [body as LeadAttachment, ...prev]);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: LeadAttachment) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/download/${doc.id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create download link");
      }
      const body = (await res.json()) as { url: string };
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Download failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Attachments are stored in your workspace document library.</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <SectionCard title={`Documents (${documents.length})`}>
        {loading ? (
          <div className="space-y-3 py-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <EmptyState title="No documents yet" description="Upload proposals, contracts, and agreements." />
        ) : (
          <div className="divide-y dark:divide-slate-800">
            {documents.map((doc) => {
              const Icon = typeIcon(doc.category, doc.mimeType);
              return (
                <div key={doc.id} className="flex items-center gap-3 py-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${categoryColors[doc.category || ""] || "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{doc.name}</p>
                    <p className="text-xs text-slate-400">
                      {doc.category || "Attachment"}
                      {doc.size ? ` · ${formatSize(doc.size)}` : ""} · {doc.uploadedByName || "Uploaded"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function typeIcon(category: string | null, mime: string | null): React.ElementType {
  if (mime?.startsWith("image/")) return Image;
  if (category === "PDF") return FileText;
  if (category === "XLSX") return FileSpreadsheet;
  return FileIcon;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
