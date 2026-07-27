import { BarChart3, FileText, FolderOpen, RefreshCw } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

import { reports } from "../data";

export function ReportStats() {
  const published = reports.filter((r) => r.status === "Published").length;
  const categories = new Set(reports.map((r) => r.category)).size;
  const distinctDates = new Set(reports.map((r) => r.lastRun)).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Reports"
        value={reports.length}
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
