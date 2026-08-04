"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  Printer,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";
import { invoiceService } from "@/services/index";
import type { Invoice } from "@/services/invoice.service";
import { invoiceStatusColors, invoiceStatusLabels } from "../types";
import { InvoiceModal } from "../components/InvoiceModal";

const currencyFmt = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/invoices/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          if (!data) router.replace("/invoices");
          else setInvoice(data);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const runAction = async (method: string, body?: Record<string, unknown>) => {
    if (!invoice) return;
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Action failed");
      }
      const updated = (await res.json()) as Invoice;
      if (updated?.id && updated?.invoiceNumber) setInvoice(updated);
      success("Invoice updated", `${updated.invoiceNumber} is now ${invoiceStatusLabels[updated.status]}`);
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleSave = async (data: Invoice) => {
    if (!invoice) return;
    try {
      const updated = await invoiceService.update(invoice.id, data as Partial<Invoice>);
      setInvoice(updated);
      setEditOpen(false);
      success("Invoice updated", `${updated.invoiceNumber} has been updated.`);
    } catch {
      showError("Error", "Failed to update invoice.");
    }
  };

  const handlePrint = () => window.print();

  const handleExportPdf = () => {
    if (!invoice) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoice.invoiceNumber}</title><style>
      body { font-family: system-ui, sans-serif; color: #0f172a; padding: 40px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .muted { color: #64748b; font-size: 12px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
      .label { text-transform: uppercase; font-size: 10px; color: #94a3b8; letter-spacing: 0.05em; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { text-align: left; border-bottom: 1px solid #e2e8f0; padding: 8px; font-size: 11px; text-transform: uppercase; color: #94a3b8; }
      td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
      .totals { margin-left: auto; width: 280px; margin-top: 16px; font-size: 13px; }
      .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
      .totals .total { border-top: 1px solid #e2e8f0; font-weight: 700; font-size: 15px; }
    </style></head><body>
      <h1>Invoice</h1><p class="muted">${invoice.invoiceNumber} · ${invoice.status}</p>
      <div class="grid">
        <div><div class="label">Customer</div><div>${invoice.customer || "-"}</div></div>
        <div><div class="label">Company</div><div>${invoice.company || "-"}</div></div>
        <div><div class="label">Due Date</div><div>${invoice.dueDate || "-"}</div></div>
      </div>
      <table><thead><tr><th>Item</th><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead><tbody>
        ${invoice.items
          .map(
            (i) =>
              `<tr><td>${i.name || i.description}</td><td>${i.description}</td><td style="text-align:right">${i.quantity}</td><td style="text-align:right">${currencyFmt(i.unitPrice, invoice.currency)}</td><td style="text-align:right">${currencyFmt(i.amount, invoice.currency)}</td></tr>`
          )
          .join("")}
      </tbody></table>
      <div class="totals">
        <div><span>Subtotal</span><span>${currencyFmt(invoice.subtotal, invoice.currency)}</span></div>
        <div><span>Tax</span><span>${currencyFmt(invoice.tax, invoice.currency)}</span></div>
        <div><span>Discount</span><span>-${currencyFmt(invoice.discount, invoice.currency)}</span></div>
        <div class="total"><span>Total</span><span>${currencyFmt(invoice.total, invoice.currency)}</span></div>
      </div>
    </body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      showError("Error", "Pop-up blocked. Allow pop-ups to export as PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleDelete = async () => {
    if (!invoice) return;
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Delete failed");
      }
      success("Invoice deleted", `${invoice.invoiceNumber} has been deleted`);
      router.push("/invoices");
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleExport = () => {
    if (!invoice) return;
    const lines = [
      "Invoice #,Customer,Company,Quote,Status,Subtotal,Tax,Discount,Total,Issue Date,Due Date",
      `${invoice.invoiceNumber},${invoice.customer},${invoice.company},${invoice.quote},${invoice.status},${invoice.subtotal},${invoice.tax},${invoice.discount},${invoice.total},${invoice.issueDate},${invoice.dueDate}`,
      "",
      "Item,Description,Quantity,Unit Price,Amount",
      ...invoice.items.map((i) => `${i.name},${i.description},${i.quantity},${i.unitPrice},${i.amount}`),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !invoice) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/invoices"
            className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{invoice.invoiceNumber}</h1>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${invoiceStatusColors[invoice.status]}`}>
                {invoiceStatusLabels[invoice.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500">{invoice.customer || "No customer"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === "DRAFT" && (
            <Button variant="outline" onClick={() => void runAction("PATCH", { status: "ISSUED" })}>
              <FileText className="mr-2 h-4 w-4 text-blue-600" />
              Issue
            </Button>
          )}
          {invoice.status !== "PAID" && invoice.status !== "VOID" && (
            <Button variant="outline" onClick={() => void runAction("PATCH", { status: "PAID" })}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              Mark Paid
            </Button>
          )}
          {invoice.status !== "VOID" && invoice.status !== "PAID" && (
            <Button variant="outline" onClick={() => void runAction("PATCH", { status: "PARTIALLY_PAID" })}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-amber-600" />
              Partially Paid
            </Button>
          )}
          {invoice.status !== "VOID" && (
            <Button variant="outline" onClick={() => void runAction("PATCH", { status: "VOID" })}>
              <XCircle className="mr-2 h-4 w-4 text-red-600" />
              Void
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => void handleExportPdf()}>
            <Printer className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void handleDelete()}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Printable document */}
      <div className="rounded-xl border bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:border-b md:p-8 dark:md:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-emerald-600" />
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Invoice</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">{invoice.invoiceNumber}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm md:text-right">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusColors[invoice.status]}`}>
                {invoiceStatusLabels[invoice.status]}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Due Date</p>
              <p className="mt-1 font-medium text-slate-900 dark:text-white">{invoice.dueDate || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Issue Date</p>
              <p className="mt-1 font-medium text-slate-900 dark:text-white">{invoice.issueDate || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Currency</p>
              <p className="mt-1 font-medium text-slate-900 dark:text-white">{invoice.currency}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <User className="h-3.5 w-3.5" /> Customer
            </p>
            <p className="font-medium text-slate-900 dark:text-white">{invoice.customer || "-"}</p>
            {invoice.lead && <p className="text-xs text-slate-500">Lead: {invoice.lead}</p>}
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Building2 className="h-3.5 w-3.5" /> Company
            </p>
            <p className="font-medium text-slate-900 dark:text-white">{invoice.company || "-"}</p>
            {invoice.opportunity && <p className="text-xs text-slate-500">Opportunity: {invoice.opportunity}</p>}
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> Created By
            </p>
            <p className="font-medium text-slate-900 dark:text-white">{invoice.createdBy || "-"}</p>
            {invoice.quote && <p className="text-xs text-slate-500">From Quote: {invoice.quote}</p>}
            {invoice.paidAt && <p className="text-xs text-emerald-600">Paid: {new Date(invoice.paidAt).toLocaleDateString()}</p>}
          </div>
        </div>

        <div className="overflow-x-auto p-6 md:p-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-700">
                <th className="pb-2">Item</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b dark:border-slate-800">
                  <td className="py-2.5 font-medium text-slate-900 dark:text-white">{item.name || item.description}</td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">{item.description}</td>
                  <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                  <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{currencyFmt(item.unitPrice, invoice.currency)}</td>
                  <td className="py-2.5 text-right font-medium text-slate-900 dark:text-white">{currencyFmt(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-900 dark:text-white">{currencyFmt(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span className="text-slate-900 dark:text-white">{currencyFmt(invoice.tax, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <span className="text-slate-900 dark:text-white">-{currencyFmt(invoice.discount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold text-slate-900 dark:text-white">
              <span>Total</span>
              <span>{currencyFmt(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <InvoiceModal
        open={editOpen}
        onOpenChange={(open) => setEditOpen(open)}
        invoice={invoice}
        onSave={handleSave}
      />
    </>
  );
}
