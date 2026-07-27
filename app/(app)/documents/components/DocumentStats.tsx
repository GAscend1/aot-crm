import { FileText, FolderOpen, HardDrive, CheckCircle } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { documents } from "../data";

export function DocumentStats() {
  const totalSize = documents
    .map((d) => parseFloat(d.size.replace(/[^0-9.]/g, "")))
    .reduce((a, b) => a + b, 0)
    .toFixed(1);

  const categories = new Set(documents.map((d) => d.category)).size;
  const activeCount = documents.filter((d) => d.status === "Active").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Documents"
        value={documents.length}
        icon={FileText}
      />

      <StatCard
        title="Categories"
        value={categories}
        icon={FolderOpen}
      />

      <StatCard
        title="Active"
        value={activeCount}
        icon={CheckCircle}
      />

      <StatCard
        title="Total Size"
        value={`${totalSize} MB`}
        icon={HardDrive}
      />
    </div>
  );
}