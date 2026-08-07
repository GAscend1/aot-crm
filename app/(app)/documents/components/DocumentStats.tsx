"use client";

import { FileText, FolderOpen, HardDrive, CheckCircle } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

type DocumentRow = {
  category: string;
  status: string;
  size: string;
};

export function DocumentStats() {
  const { data, loading } = useApiList<DocumentRow>("/api/documents?pageSize=1000");

  // Defensive: never assume `size` is a pre-formatted string — tolerate
  // numbers, null and undefined without crashing the module (regression guard
  // for the Documents runtime error class).
  const totalSizeKb = data
    .map((d) => {
      const raw =
        typeof d.size === "string"
          ? d.size.replace(/[^0-9.]/g, "")
          : String(d.size ?? "").replace(/[^0-9.]/g, "");
      return parseFloat(raw) || 0;
    })
    .reduce((a, b) => a + b, 0);
  const totalSizeMb = (totalSizeKb / 1024).toFixed(1);

  const categories = new Set(data.map((d) => d.category)).size;
  const activeCount = data.filter((d) => d.status === "Active").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Documents" value={loading ? "…" : data.length} icon={FileText} />
      <StatCard title="Categories" value={loading ? "…" : categories} icon={FolderOpen} />
      <StatCard title="Active" value={loading ? "…" : activeCount} icon={CheckCircle} />
      <StatCard title="Total Size" value={loading ? "…" : `${totalSizeMb} MB`} icon={HardDrive} />
    </div>
  );
}
