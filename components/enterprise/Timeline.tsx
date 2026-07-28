"use client";

import { motion } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  Info,
  Archive,
  RotateCcw,
} from "lucide-react";

export interface TimelineEntry {
  id: string;
  action: "created" | "updated" | "deleted" | "restored" | "archived" | "note";
  field?: string;
  oldValue?: string;
  newValue?: string;
  userName: string;
  timestamp: string;
}

interface TimelineProps {
  entries: TimelineEntry[];
}

const actionConfig = {
  created: { icon: Plus, color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" },
  updated: { icon: Edit3, color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" },
  deleted: { icon: Trash2, color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" },
  restored: { icon: RotateCcw, color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300" },
  archived: { icon: Archive, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  note: { icon: Info, color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" },
};

export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-sm text-slate-500">
        <Info className="h-8 w-8" />
        <p>No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-0">
        {entries.map((entry, index) => {
          const config = actionConfig[entry.action];
          const Icon = config.icon;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="relative flex gap-4 pb-6 pl-10"
            >
              <div
                className={`absolute left-2.5 flex h-7 w-7 items-center justify-center rounded-full ${config.color} ring-4 ring-white dark:ring-slate-900`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {entry.userName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  {entry.action === "created" && "Created this record"}
                  {entry.action === "deleted" && "Deleted this record"}
                  {entry.action === "restored" && "Restored this record"}
                  {entry.action === "archived" && "Archived this record"}
                  {entry.action === "updated" && entry.field && (
                    <>
                      Updated{" "}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {entry.field}
                      </span>
                      {entry.oldValue && entry.newValue && (
                        <>
                          {" "}from{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            &ldquo;{entry.oldValue}&rdquo;
                          </span>{" "}
                          to{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            &ldquo;{entry.newValue}&rdquo;
                          </span>
                        </>
                      )}
                    </>
                  )}
                  {entry.action === "note" && "Added a note"}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
