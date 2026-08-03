"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  Image,
  Pencil,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntityStatusBadge } from "@/components/enterprise/EntityStatusBadge";
import {
  RecordQuickActions,
  RecordWorkspace,
  RecordWorkspaceField,
  RecordWorkspaceGrid,
  RecordWorkspaceSection,
  useRecordWorkspace,
} from "@/components/enterprise/RecordWorkspace";
import { useToastContext } from "@/app/(app)/AppProviders";
import { documentService } from "@/services/index";

import type { Document } from "../types";
import { DocumentDrawer } from "./DocumentDrawer";
import { DocumentDeleteDialog } from "./DocumentDeleteDialog";

const typeIcons: Record<string, LucideIcon> = {
  PDF: FileText,
  DOCX: FileText,
  XLSX: FileSpreadsheet,
  PPTX: FileText,
  Image,
};

interface DocumentWorkspaceProps {
  onChanged?: () => void;
}

export function DocumentWorkspace({ onChanged }: DocumentWorkspaceProps) {
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(documentService);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const Icon = record?.type ? typeIcons[record.type] ?? FileIcon : FileIcon;

  const handleSave = async (data: Document) => {
    if (!record) return;
    try {
      await documentService.update(record.id, data as Partial<Document>);
      success("Document updated", `${data.name} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save document.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await documentService.delete(record.id);
      success("Document deleted");
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to delete document.");
    }
  };

  return (
    <>
      <RecordWorkspace
        open={recordId !== null}
        onClose={close}
        loading={loading}
        title={record?.name ?? "Document"}
        eyebrow="Document"
        subtitle={record?.category}
        badge={
          record?.status ? (
            <EntityStatusBadge label={record.status} />
          ) : undefined
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete document"
            >
              <Trash2 />
            </Button>
          </>
        }
        sidebar={
          <RecordQuickActions
            actions={[
              {
                label: "Edit Document",
                icon: Pencil,
                onClick: () => setEditOpen(true),
              },
              {
                label: "Delete",
                icon: Trash2,
                destructive: true,
                onClick: () => setDeleteOpen(true),
              },
            ]}
          />
        }
      >
        <RecordWorkspaceSection title="Details">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-foreground">
              {record?.type ?? "File"}
            </span>
          </div>
          <RecordWorkspaceGrid>
            <RecordWorkspaceField label="Category" value={record?.category} />
            <RecordWorkspaceField label="Type" value={record?.type} />
            <RecordWorkspaceField label="Size" value={record?.size} />
            <RecordWorkspaceField label="Version" value={record?.version} />
            <RecordWorkspaceField
              label="Uploaded"
              value={
                record?.uploadDate
                  ? new Date(record.uploadDate).toLocaleDateString()
                  : undefined
              }
            />
            <RecordWorkspaceField label="Uploaded By" value={record?.uploadedBy} />
          </RecordWorkspaceGrid>
        </RecordWorkspaceSection>

        {record?.tags && record.tags.length > 0 && (
          <RecordWorkspaceSection title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {record.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </RecordWorkspaceSection>
        )}

        <RecordWorkspaceSection title="Description">
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {record?.description || "No description provided."}
          </p>
        </RecordWorkspaceSection>

        <RecordWorkspaceSection title="Timestamps">
          <RecordWorkspaceGrid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
            <RecordWorkspaceField
              label="Created"
              value={
                record?.createdAt
                  ? new Date(record.createdAt).toLocaleString()
                  : undefined
              }
            />
            <RecordWorkspaceField
              label="Updated"
              value={
                record?.updatedAt
                  ? new Date(record.updatedAt).toLocaleString()
                  : undefined
              }
            />
          </RecordWorkspaceGrid>
        </RecordWorkspaceSection>
      </RecordWorkspace>

      {record && (
        <>
          <DocumentDrawer
            open={editOpen}
            onOpenChange={(openState) => {
              setEditOpen(openState);
              if (!openState) reload();
            }}
            document={record}
            onSave={(data) => void handleSave(data)}
          />
          <DocumentDeleteDialog
            open={deleteOpen}
            document={record}
            onConfirm={() => void handleDelete()}
            onCancel={() => setDeleteOpen(false)}
          />
        </>
      )}
    </>
  );
}
