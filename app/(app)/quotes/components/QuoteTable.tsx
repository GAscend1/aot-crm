"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";
import { createColumns } from "../columns";
import { quoteService } from "@/services/index";
import type { Quote } from "@/services/quote.service";
import { QuoteDrawer } from "./QuoteDrawer";
import { QuoteDeleteDialog } from "./QuoteDeleteDialog";
import { QuoteToolbar } from "./QuoteToolbar";
import { quoteStatusLabels } from "../types";

interface QuoteTableProps {
  prefillOpportunityId?: string;
  prefillLeadId?: string;
}

export function QuoteTable({ prefillOpportunityId, prefillLeadId }: QuoteTableProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [prefill, setPrefill] = useState<{ customer?: string; company?: string; opportunity?: string; customerId?: string; companyId?: string; opportunityId?: string; leadId?: string } | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuote, setDeletingQuote] = useState<Quote | undefined>();

  useEffect(() => {
    quoteService.findAll().then((result) => {
      setQuotes(result.data);
      setLoading(false);
    });
  }, []);

  // Prefill from opportunity/lead context (e.g. "Create Quote" from opportunity detail)
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
          setEditingQuote(undefined);
          setDrawerOpen(true);
        });
    } else if (prefillLeadId) {
      fetch(`/api/leads/${prefillLeadId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((l: { title?: string; company?: string } | null) => {
          if (!l) return;
          setPrefill({ customer: l.title, opportunity: l.title, leadId: prefillLeadId, company: l.company });
          setEditingQuote(undefined);
          setDrawerOpen(true);
        });
    }
  }, [prefillOpportunityId, prefillLeadId]);

  const filtered = useMemo(() => {
    let result = quotes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.quoteNumber.toLowerCase().includes(q) ||
          quote.customer.toLowerCase().includes(q) ||
          quote.company.toLowerCase().includes(q) ||
          quote.opportunity.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((q) => q.status === statusFilter);
    return result;
  }, [quotes, searchQuery, statusFilter]);

  const handleView = useCallback(
    (quote: Quote) => router.push(`/quotes/${quote.id}`),
    [router]
  );

  const handleEdit = useCallback((quote: Quote) => {
    setEditingQuote(quote);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback((quote: Quote) => {
    setDeletingQuote(quote);
    setDeleteDialogOpen(true);
  }, []);

  const handleDuplicate = useCallback(
    async (quote: Quote) => {
      try {
        const res = await fetch(`/api/quotes/${quote.id}/duplicate`, { method: "POST" });
        if (!res.ok) throw new Error("Failed");
        const created = (await res.json()) as Quote;
        setQuotes((prev) => [created, ...prev]);
        success("Quote duplicated", `${quote.quoteNumber} → ${created.quoteNumber}`);
      } catch {
        showError("Error", "Could not duplicate quote.");
      }
    },
    [success, showError]
  );

  const setQuoteStatus = useCallback(
    async (quote: Quote, status: string) => {
      try {
        const res = await fetch(`/api/quotes/${quote.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = (await res.json()) as Quote;
        setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        success("Quote updated", `${quote.quoteNumber} marked ${quoteStatusLabels[updated.status]}`);
      } catch {
        showError("Error", "Could not update quote status.");
      }
    },
    [success, showError]
  );

  const handleConvert = useCallback(
    async (quote: Quote) => {
      try {
        const res = await fetch(`/api/quotes/${quote.id}/convert`, { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to convert");
        }
        const invoice = (await res.json()) as { id: string; invoiceNumber: string };
        success("Invoice created", `${quote.quoteNumber} converted to ${invoice.invoiceNumber}`);
        router.push(`/invoices/${invoice.id}`);
      } catch (err) {
        showError("Error", err instanceof Error ? err.message : "Could not convert quote.");
      }
    },
    [success, showError, router]
  );

  const columns = useMemo(
    () =>
      createColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onDuplicate: (q) => void handleDuplicate(q),
        onAccept: (q) => void setQuoteStatus(q, "ACCEPTED"),
        onReject: (q) => void setQuoteStatus(q, "REJECTED"),
        onConvert: (q) => void handleConvert(q),
      }),
    [handleView, handleEdit, handleDelete, handleDuplicate, setQuoteStatus, handleConvert]
  );

  const handleSave = useCallback(
    async (data: Quote) => {
      try {
        if (editingQuote) {
          const updated = await quoteService.update(editingQuote.id, data as Partial<Quote>);
          setQuotes((prev) => prev.map((q) => (q.id === editingQuote.id ? updated : q)));
          success("Quote updated", `${updated.quoteNumber} has been updated.`);
        } else {
          const created = await quoteService.create(data as Omit<Quote, "id" | "createdAt" | "updatedAt">);
          setQuotes((prev) => [created, ...prev]);
          success("Quote created", `${created.quoteNumber} has been added.`);
        }
        setDrawerOpen(false);
        setEditingQuote(undefined);
      } catch {
        showError("Error", "Failed to save quote.");
      }
    },
    [editingQuote, success, showError]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingQuote) {
      try {
        await quoteService.delete(deletingQuote.id);
        setQuotes((prev) => prev.filter((q) => q.id !== deletingQuote.id));
        success("Quote archived", `${deletingQuote.quoteNumber} has been archived.`);
        setDeletingQuote(undefined);
      } catch {
        showError("Error", "Failed to archive quote.");
      }
    }
  }, [deletingQuote, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingQuote(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await quoteService.findAll();
    setQuotes(result.data);
    setLoading(false);
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Quote[]) => {
      if (action === "delete") {
        for (const row of rows) await quoteService.delete(row.id);
        setQuotes((prev) => prev.filter((q) => !rows.find((r) => r.id === q.id)));
        success("Archived", `${rows.length} quote(s) archived.`);
      } else if (action === "export") {
        const csv = [
          "Quote #,Customer,Company,Status,Total,Valid Until,Created",
          ...rows.map((r) => `${r.quoteNumber},${r.customer},${r.company},${r.status},${r.total},${r.validUntil},${r.createdAt}`),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "quotes.csv";
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
        onRowClick={handleView}
        onBulkAction={handleBulkAction}
        bulkActions={[
          { action: "export", label: "Export CSV" },
          { action: "delete", label: "Archive" },
        ]}
        toolbar={
          <QuoteToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            status={(statusFilter || "all") as never}
            onStatusChange={(s) => setStatusFilter(s === "all" ? "" : s)}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <QuoteDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setEditingQuote(undefined);
            setPrefill(undefined);
          }
        }}
        quote={editingQuote ?? null}
        prefill={prefill}
        onSave={handleSave}
      />

      <QuoteDeleteDialog
        open={deleteDialogOpen}
        quote={deletingQuote ?? null}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingQuote(undefined);
        }}
      />
    </div>
  );
}
