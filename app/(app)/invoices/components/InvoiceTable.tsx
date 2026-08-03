"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";
import { createColumns } from "../columns";
import { invoiceService } from "@/services/index";
import type { Invoice } from "@/services/invoice.service";
import { InvoiceDrawer } from "./InvoiceDrawer";
import { InvoiceDeleteDialog } from "./InvoiceDeleteDialog";
import { InvoiceToolbar } from "./InvoiceToolbar";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { invoiceStatusLabels } from "../types";

interface InvoicePrefill {
  customer?: string;
  company?: string;
  opportunity?: string;
  customerId?: string;
  companyId?: string;
  opportunityId?: string;
}

interface InvoiceTableProps {
  prefillOpportunityId?: string;
}

export function InvoiceTable({ prefillOpportunityId }: InvoiceTableProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [prefill, setPrefill] = useState<InvoicePrefill | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | undefined>();

  // When opened from an opportunity detail page, filter to that opportunity's invoices.
  useEffect(() => {
    invoiceService
      .findAll(
        prefillOpportunityId
          ? { filters: { opportunityId: prefillOpportunityId } }
          : undefined
      )
      .then((result) => {
        setInvoices(result.data);
        setLoading(false);
      });
  }, [prefillOpportunityId]);

  // Prefill from opportunity context (e.g. "Create Invoice" from opportunity detail)
  useEffect(() => {
    if (prefillOpportunityId) {
      fetch(`/api/opportunities/${prefillOpportunityId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((o: { customer?: string; customerId?: string; company?: string; companyId?: string; title?: string } | null) => {
          if (!o) return;
          setPrefill({
            customer: o.customer,
            customerId: o.customerId,
            company: o.company,
            companyId: o.companyId,
            opportunity: o.title,
            opportunityId: prefillOpportunityId,
          });
          setEditingInvoice(undefined);
          setDrawerOpen(true);
        });
    }
  }, [prefillOpportunityId]);

  const filtered = useMemo(() => {
    let result = invoices;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customer.toLowerCase().includes(q) ||
          inv.company.toLowerCase().includes(q) ||
          inv.opportunity.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    return result;
  }, [invoices, searchQuery, statusFilter]);

  const handleView = useCallback(
    (invoice: Invoice) =>
      router.push(`/invoices?record=${encodeURIComponent(invoice.id)}`, {
        scroll: false,
      }),
    [router]
  );

  const handleRowClick = useCallback(
    (invoice: Invoice) =>
      router.push(`/invoices?record=${encodeURIComponent(invoice.id)}`, {
        scroll: false,
      }),
    [router]
  );
  const handleEdit = useCallback((invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDrawerOpen(true);
  }, []);
  const handleDelete = useCallback((invoice: Invoice) => {
    setDeletingInvoice(invoice);
    setDeleteDialogOpen(true);
  }, []);

  const setInvoiceStatus = useCallback(
    async (invoice: Invoice, status: string) => {
      try {
        const res = await fetch(`/api/invoices/${invoice.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = (await res.json()) as Invoice;
        setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        success("Invoice updated", `${invoice.invoiceNumber} marked ${invoiceStatusLabels[updated.status]}`);
      } catch {
        showError("Error", "Could not update invoice status.");
      }
    },
    [success, showError]
  );

  const columns = useMemo(
    () =>
      createColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onMarkPaid: (i) => void setInvoiceStatus(i, "PAID"),
        onVoid: (i) => void setInvoiceStatus(i, "VOID"),
      }),
    [handleView, handleEdit, handleDelete, setInvoiceStatus]
  );

  const handleSave = useCallback(
    async (data: Invoice) => {
      try {
        if (editingInvoice) {
          const updated = await invoiceService.update(editingInvoice.id, data as Partial<Invoice>);
          setInvoices((prev) => prev.map((i) => (i.id === editingInvoice.id ? updated : i)));
          success("Invoice updated", `${updated.invoiceNumber} has been updated.`);
        } else {
          const created = await invoiceService.create(data as Omit<Invoice, "id" | "createdAt" | "updatedAt">);
          setInvoices((prev) => [created, ...prev]);
          success("Invoice created", `${created.invoiceNumber} has been added.`);
        }
        setDrawerOpen(false);
        setEditingInvoice(undefined);
      } catch {
        showError("Error", "Failed to save invoice.");
      }
    },
    [editingInvoice, success, showError]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingInvoice) {
      try {
        await invoiceService.delete(deletingInvoice.id);
        setInvoices((prev) => prev.filter((i) => i.id !== deletingInvoice.id));
        success("Invoice archived", `${deletingInvoice.invoiceNumber} has been archived.`);
        setDeletingInvoice(undefined);
      } catch {
        showError("Error", "Failed to archive invoice.");
      }
    }
  }, [deletingInvoice, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingInvoice(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await invoiceService.findAll();
    setInvoices(result.data);
    setLoading(false);
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Invoice[]) => {
      if (action === "delete") {
        for (const row of rows) await invoiceService.delete(row.id);
        setInvoices((prev) => prev.filter((i) => !rows.find((r) => r.id === i.id)));
        success("Archived", `${rows.length} invoice(s) archived.`);
      } else if (action === "export") {
        const csv = [
          "Invoice #,Customer,Company,Status,Total,Due Date,Created",
          ...rows.map((r) => `${r.invoiceNumber},${r.customer},${r.company},${r.status},${r.total},${r.dueDate},${r.createdAt}`),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "invoices.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [success]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filtered}
        enableRowSelection
        onRowClick={handleRowClick}
        onBulkAction={handleBulkAction}
        bulkActions={[
          { action: "export", label: "Export CSV" },
          { action: "delete", label: "Archive" },
        ]}
        toolbar={
          <InvoiceToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            status={(statusFilter || "all") as never}
            onStatusChange={(s) => setStatusFilter(s === "all" ? "" : s)}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <InvoiceDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setEditingInvoice(undefined);
            setPrefill(undefined);
          }
        }}
        invoice={editingInvoice ?? null}
        prefill={prefill}
        onSave={handleSave}
      />

      <InvoiceDeleteDialog
        open={deleteDialogOpen}
        invoice={deletingInvoice ?? null}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingInvoice(undefined);
        }}
      />

      <InvoiceWorkspace
        onChanged={() => {
          invoiceService
            .findAll(
              prefillOpportunityId
                ? { filters: { opportunityId: prefillOpportunityId } }
                : undefined
            )
            .then((result) => {
              setInvoices(result.data);
            });
        }}
      />
    </div>
  );
}
