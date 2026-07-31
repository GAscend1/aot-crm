"use client";

import { FileText, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

type InvoiceRow = { status: string; total: number };

export function InvoiceStats() {
  const { data, loading } = useApiList<InvoiceRow>("/api/invoices?pageSize=1000");

  const paid = data.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const outstanding = data.filter((i) => ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const overdue = data.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
  const total = data.reduce((s, i) => s + i.total, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Invoiced" value={loading ? "…" : `$${(total / 1000).toFixed(0)}K`} icon={FileText} variant="primary" />
      <StatCard title="Paid Revenue" value={loading ? "…" : `$${(paid / 1000).toFixed(0)}K`} icon={CheckCircle2} variant="success" />
      <StatCard title="Outstanding" value={loading ? "…" : `$${(outstanding / 1000).toFixed(0)}K`} icon={DollarSign} />
      <StatCard title="Overdue" value={loading ? "…" : `$${(overdue / 1000).toFixed(0)}K`} icon={AlertTriangle} variant="danger" />
    </div>
  );
}
