"use client";

import { BarChart3, FileText, FolderOpen, RefreshCw } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

import { Report } from "../types";

export function ReportStats() {
  const { data } = useApiList<Report>("/api/reports/manage?pageSize=1000");

  const published = data.filter((r) => r.status === "Published").length;
  const categories = new Set(data.map((r) => r.category)).size;
  const distinctDates = new Set(data.filter((r) => r.lastRun).map((r) => r.lastRun)).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Reports"
        value={data.length}
        icon={FileText}
      />

      <StatCard
        title="Published"
        value={published}
        icon={BarChart3}
      />

      <StatCard
        title="Categories"
        value={categories}
        icon={FolderOpen}
      />

      <StatCard
        title="Last Run (days)"
        value={distinctDates}
        icon={RefreshCw}
      />
    </div>
  );
}
