"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Copy,
  Download,
  FileText,
  Mail,
  Printer,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";
import type { Quote } from "@/services/quote.service";
import { quoteStatusColors, quoteStatusLabels } from "../types";

const currencyFmt = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/quotes/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          if (!data) router.replace("/quotes");
          else setQuote(data);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const runAction = async (path: string, method = "POST", body?: Record<string, unknown>) => {
    if (!quote) return;
    try {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Action failed");
      }
      const data = (await res.json()) as Quote & { invoiceNumber?: string };
      if (data?.invoiceNumber && data?.id && !data.quoteNumber) {
        success("Invoice created", `${quote.quoteNumber} converted to ${data.invoiceNumber}`);
        router.push(`/invoices/${data.id}`);
        return;
      }
      setQuote(data ?? quote);
      success("Quote updated");
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Action failed");
    }
  };

  const setQuoteStatus = async (status: string) => {
    await runAction(`/api/quotes/${quote?.id}`, "POST", { status });
  };

  const handleDuplicate = async () => {
    if (!quote) return;
    try {
      const res = await fetch(`/api/quotes/${quote.id}/duplicate`, { method: "POST" });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to duplicate");
      }
      const created = (await res.json()) as { id: string; quoteNumber: string };
      success("Quote duplicated", `${quote.quoteNumber} → ${created.quoteNumber}`);
      router.push(`/quotes/${created.id}`);
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Could not duplicate quote.");
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to archive");
      success("Quote archived");
      router.push("/quotes");
    } catch {
      showError("Error", "Could not archive quote.");
    }
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    if (!quote) return;
    const lines = [
      "Quote #,Customer,Company,Opportunity,Status,Subtotal,Tax,Discount,Total,Valid Until",
      `${quote.quoteNumber},${quote.customer},${quote.company},${quote.opportunity},${quote.status},${quote.subtotal},${quote.tax},${quote.discount},${quote.total},${quote.validUntil}`,
      "",
      "Item,Description,Quantity,Unit Price,Amount",
      ...quote.items.map((i) => `${i.name},${i.description},${i.quantity},${i.unitPrice},${i.amount}`),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quote.quoteNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !quote) {
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
            href="/quotes"
            className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{quote.quoteNumber}</h1>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${quoteStatusColors[quote.status]}`}>
                {quoteStatusLabels[quote.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500">{quote.customer || "No customer"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quote.status === "DRAFT" && (
            <Button variant="outline" onClick={() => void setQuoteStatus("SENT")}>
              <Mail className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
          {quote.status === "ACCEPTED" && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => void runAction(`/api/quotes/${quote.id}/convert`)}>
              <FileText className="mr-2 h-4 w-4" />
              Convert to Invoice
            </Button>
          )}
          {quote.status !== "ACCEPTED" && quote.status !== "REJECTED" && (
            <Button variant="outline" onClick={() => void setQuoteStatus("ACCEPTED")}>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              Accept
            </Button>
          )}
          {(quote.status === "DRAFT" || quote.status === "SENT") && (
            <Button variant="outline" onClick={() => void setQuoteStatus("REJECTED")}>
              <X className="mr-2 h-4 w-4 text-red-600" />
              Reject
            </Button>
          )}
          <Button variant="outline" onClick={() => void handleDuplicate()}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
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
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Quote</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">{quote.quoteNumber}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm md:text-right">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${quoteStatusColors[quote.status]}`}>
                {quoteStatusLabels[quote.status]}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Valid Until</p>
              <p className="mt-1 font-medium text-slate-900 dark:text-white">{quote.validUntil || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Currency</p>
              <p className="mt-1 font-medium text-slate-900 dark:text-white">{quote.currency}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Issued</p>
              <p className="mt-1 font-medium text-slate-900 dark:text-white">{new Date(quote.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <User className="h-3.5 w-3.5" /> Customer
            </p>
            <p className="font-medium text-slate-900 dark:text-white">{quote.customer || "-"}</p>
            {quote.lead && <p className="text-xs text-slate-500">Lead: {quote.lead}</p>}
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Building2 className="h-3.5 w-3.5" /> Company
            </p>
            <p className="font-medium text-slate-900 dark:text-white">{quote.company || "-"}</p>
            {quote.opportunity && <p className="text-xs text-slate-500">Opportunity: {quote.opportunity}</p>}
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> Created By
            </p>
            <p className="font-medium text-slate-900 dark:text-white">{quote.createdBy || "-"}</p>
            {quote.notes && <p className="text-xs text-slate-500">Notes: {quote.notes}</p>}
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
              {quote.items.map((item) => (
                <tr key={item.id} className="border-b dark:border-slate-800">
                  <td className="py-2.5 font-medium text-slate-900 dark:text-white">{item.name || item.description}</td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">{item.description}</td>
                  <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                  <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{currencyFmt(item.unitPrice, quote.currency)}</td>
                  <td className="py-2.5 text-right font-medium text-slate-900 dark:text-white">{currencyFmt(item.amount, quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-900 dark:text-white">{currencyFmt(quote.subtotal, quote.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span className="text-slate-900 dark:text-white">{currencyFmt(quote.tax, quote.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <span className="text-slate-900 dark:text-white">-{currencyFmt(quote.discount, quote.currency)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold text-slate-900 dark:text-white">
              <span>Total</span>
              <span>{currencyFmt(quote.total, quote.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
