"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FileDown,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";

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
import { quoteService } from "@/services/index";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import type { Quote } from "../types";
import { QuoteModal } from "./QuoteModal";

interface QuoteWorkspaceProps {
  onChanged?: () => void;
}

export function QuoteWorkspace({ onChanged }: QuoteWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, open, close, reload } =
    useRecordWorkspace(quoteService);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setStatus = useCallback(
    async (status: Quote["status"], label: string) => {
      if (!record) return;
      try {
        const res = await fetch(`/api/quotes/${record.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Failed");
        success("Quote updated", `${record.quoteNumber} marked ${label}`);
        onChanged?.();
        reload();
      } catch {
        showError("Error", "Could not update quote status.");
      }
    },
    [record, success, showError, onChanged, reload]
  );

  const handleConvert = useCallback(async () => {
    if (!record) return;
    try {
      const res = await fetch(`/api/quotes/${record.id}/convert`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to convert");
      }
      const invoice = (await res.json()) as { id: string; invoiceNumber: string };
      success("Invoice created", `${record.quoteNumber} converted to ${invoice.invoiceNumber}`);
      close();
      onChanged?.();
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Could not convert quote.");
    }
  }, [record, success, close, onChanged, router, showError]);

  const handleDuplicate = useCallback(async () => {
    if (!record) return;
    try {
      const res = await fetch(`/api/quotes/${record.id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const created = (await res.json()) as Quote;
      success("Quote duplicated", `${record.quoteNumber} → ${created.quoteNumber}`);
      onChanged?.();
      open(created.id);
    } catch {
      showError("Error", "Could not duplicate quote.");
    }
  }, [record, success, showError, onChanged, open]);

  const handleDelete = async () => {
    if (!record) return;
    try {
      await quoteService.delete(record.id);
      success("Quote archived");
      setDeleteOpen(false);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to archive quote.");
    }
  };

  const handleSave = async (data: Quote) => {
    if (!record) return;
    try {
      await quoteService.update(record.id, data as Partial<Quote>);
      success("Quote updated", `${data.quoteNumber} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save quote.");
    }
  };

  const quickActions = useMemo(
    () => [
      {
        label: "Mark as Sent",
        icon: Send,
        disabled: record?.status === "SENT" || record?.status === "ACCEPTED",
        onClick: () => void setStatus("SENT", "Sent"),
      },
      {
        label: "Mark as Accepted",
        icon: CheckCircle2,
        disabled: record?.status === "ACCEPTED",
        onClick: () => void setStatus("ACCEPTED", "Accepted"),
      },
      {
        label: "Mark as Rejected",
        icon: XCircle,
        disabled: record?.status === "REJECTED" || record?.status === "ACCEPTED",
        onClick: () => void setStatus("REJECTED", "Rejected"),
      },
      {
        label: "Convert to Invoice",
        icon: FileDown,
        disabled: record?.status !== "ACCEPTED",
        onClick: () => void handleConvert(),
      },
      {
        label: "Duplicate",
        icon: Copy,
        onClick: () => void handleDuplicate(),
      },
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            router.push(`/quotes/${record.id}`);
          }
        },
      },
    ],
    [record, router, close, setStatus, handleConvert, handleDuplicate]
  );

  const currency = record?.currency ?? "USD";

  return (
    <>
      <RecordWorkspace
        open={recordId !== null}
        onClose={close}
        loading={loading}
        title={record?.quoteNumber ?? "Quote"}
        eyebrow="Quote"
        subtitle={record?.customer}
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
              aria-label="Archive quote"
            >
              <Trash2 />
            </Button>
          </>
        }
        sidebar={
          <RecordQuickActions
            actions={[
              ...quickActions,
              {
                label: "Archive",
                icon: Trash2,
                destructive: true,
                onClick: () => setDeleteOpen(true),
              },
            ]}
          />
        }
      >
        <RecordWorkspaceSection
          title="Details"
          actions={
            record?.total != null ? (
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {currency} {record.total.toLocaleString()}
              </span>
            ) : undefined
          }
        >
          <RecordWorkspaceGrid>
            <RecordWorkspaceField label="Customer" value={record?.customer} />
            <RecordWorkspaceField label="Company" value={record?.company} />
            <RecordWorkspaceField label="Opportunity" value={record?.opportunity} />
            <RecordWorkspaceField label="Lead" value={record?.lead} />
            <RecordWorkspaceField label="Created By" value={record?.createdBy} />
            <RecordWorkspaceField
              label="Valid Until"
              value={
                record?.validUntil
                  ? new Date(record.validUntil).toLocaleDateString()
                  : undefined
              }
            />
            <RecordWorkspaceField
              label="Subtotal"
              value={
                record?.subtotal != null
                  ? `${currency} ${record.subtotal.toLocaleString()}`
                  : undefined
              }
            />
            <RecordWorkspaceField
              label="Tax"
              value={
                record?.tax != null
                  ? `${currency} ${record.tax.toLocaleString()}`
                  : undefined
              }
            />
            <RecordWorkspaceField
              label="Discount"
              value={
                record?.discount != null
                  ? `${currency} ${record.discount.toLocaleString()}`
                  : undefined
              }
            />
          </RecordWorkspaceGrid>
        </RecordWorkspaceSection>

        {record?.items && record.items.length > 0 && (
          <RecordWorkspaceSection
            title={`Line Items (${record.items.length})`}
          >
            <ul className="divide-y">
              {record.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {currency} {item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {currency} {item.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </RecordWorkspaceSection>
        )}

        <RecordWorkspaceSection title="Notes">
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {record?.notes || "No notes added yet."}
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
          <QuoteModal
            open={editOpen}
            onOpenChange={(openState) => {
              setEditOpen(openState);
              if (!openState) reload();
            }}
            quote={record}
            onSave={(data) => void handleSave(data)}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Archive Quote"
            message={
              <>
                Are you sure you want to archive{" "}
                <strong>{record.quoteNumber}</strong>? This action cannot be undone.
              </>
            }
            confirmLabel="Archive"
            variant="danger"
            onConfirm={() => void handleDelete()}
          />
        </>
      )}
    </>
  );
}
