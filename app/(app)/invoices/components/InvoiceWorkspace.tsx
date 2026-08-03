"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Ban,
  ExternalLink,
  Pencil,
  Trash2,
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
import { invoiceService } from "@/services/index";

import type { Invoice } from "../types";
import { InvoiceDrawer } from "./InvoiceDrawer";
import { InvoiceDeleteDialog } from "./InvoiceDeleteDialog";

interface InvoiceWorkspaceProps {
  onChanged?: () => void;
}

export function InvoiceWorkspace({ onChanged }: InvoiceWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(invoiceService);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setStatus = async (status: Invoice["status"], label: string) => {
    if (!record) return;
    try {
      const res = await fetch(`/api/invoices/${record.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      success("Invoice updated", `${record.invoiceNumber} marked ${label}`);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Could not update invoice status.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await invoiceService.delete(record.id);
      success("Invoice archived");
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to archive invoice.");
    }
  };

  const handleSave = async (data: Invoice) => {
    if (!record) return;
    try {
      await invoiceService.update(record.id, data as Partial<Invoice>);
      success("Invoice updated", `${data.invoiceNumber} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save invoice.");
    }
  };

  const quickActions = useMemo(
    () => [
      {
        label: "Mark as Paid",
        icon: BadgeCheck,
        disabled: record?.status === "PAID" || record?.status === "VOID",
        onClick: () => void setStatus("PAID", "Paid"),
      },
      {
        label: "Void Invoice",
        icon: Ban,
        disabled: record?.status === "VOID",
        onClick: () => void setStatus("VOID", "Void"),
      },
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            router.push(`/invoices/${record.id}`);
          }
        },
      },
    ],
    [record, router, close]
  );

  const currency = record?.currency ?? "USD";

  return (
    <>
      <RecordWorkspace
        open={recordId !== null}
        onClose={close}
        loading={loading}
        title={record?.invoiceNumber ?? "Invoice"}
        eyebrow="Invoice"
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
              aria-label="Archive invoice"
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
            <RecordWorkspaceField label="Quote" value={record?.quote} />
            <RecordWorkspaceField label="Created By" value={record?.createdBy} />
            <RecordWorkspaceField
              label="Issue Date"
              value={
                record?.issueDate
                  ? new Date(record.issueDate).toLocaleDateString()
                  : undefined
              }
            />
            <RecordWorkspaceField
              label="Due Date"
              value={
                record?.dueDate
                  ? new Date(record.dueDate).toLocaleDateString()
                  : undefined
              }
            />
            <RecordWorkspaceField
              label="Paid At"
              value={
                record?.paidAt
                  ? new Date(record.paidAt).toLocaleDateString()
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
          <InvoiceDrawer
            open={editOpen}
            onOpenChange={(openState) => {
              setEditOpen(openState);
              if (!openState) reload();
            }}
            invoice={record}
            onSave={(data) => void handleSave(data)}
          />
          <InvoiceDeleteDialog
            open={deleteOpen}
            invoice={record}
            onConfirm={() => void handleDelete()}
            onCancel={() => setDeleteOpen(false)}
          />
        </>
      )}
    </>
  );
}
