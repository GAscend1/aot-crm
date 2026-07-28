"use client";

import { ReactNode, useState } from "react";
import { Maximize2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  fullscreen?: boolean;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className = "",
  onRefresh,
  onExport,
  fullscreen,
}: ChartCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900 dark:border-slate-700 ${
        expanded ? "fixed inset-4 z-50 overflow-auto" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between border-b px-5 py-3 dark:border-slate-700">
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button variant="ghost" size="icon-xs" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {onExport && (
            <Button variant="ghost" size="icon-xs" onClick={onExport}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          {fullscreen && (
            <Button variant="ghost" size="icon-xs" onClick={() => setExpanded(!expanded)}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
