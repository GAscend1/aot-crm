"use client";

import { FileText, CheckCircle2, DollarSign, Percent } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

type QuoteRow = { status: string; total: number };

export function QuoteStats() {
  const { data, loading } = useApiList<QuoteRow>("/api/quotes?pageSize=1000");

  const accepted = data.filter((q) => q.status === "ACCEPTED");
  const acceptedValue = accepted.reduce((s, q) => s + q.total, 0);
  const totalValue = data.reduce((s, q) => s + q.total, 0);
  const acceptanceRate = data.length ? Math.round((accepted.length / data.length) * 100) : 0;
  const openQuotes = data.filter((q) => ["DRAFT", "SENT"].includes(q.status)).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Quotes" value={loading ? "…" : data.length} icon={FileText} variant="primary" />
      <StatCard title="Open Quotes" value={loading ? "…" : openQuotes} icon={CheckCircle2} />
      <StatCard title="Accepted Value" value={loading ? "…" : `$${(acceptedValue / 1000).toFixed(0)}K`} icon={DollarSign} variant="success" />
      <StatCard title="Acceptance Rate" value={loading ? "…" : `${acceptanceRate}%`} icon={Percent} variant="warning" subtitle={`of ${totalValue ? "$" + (totalValue / 1000).toFixed(0) + "K" : "0"} total quoted`} />
    </div>
  );
}
