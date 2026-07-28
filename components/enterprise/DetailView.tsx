"use client";

import { ReactNode } from "react";
import { ArrowLeft, Edit3, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DetailViewProps {
  title: string;
  description?: string;
  backHref: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

export function DetailView({
  title,
  description,
  backHref,
  onEdit,
  onDelete,
  children,
  actions,
}: DetailViewProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
      <div className="border-b px-6 py-4 dark:border-slate-700">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-900 dark:text-white">
        {value ?? "-"}
      </p>
    </div>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}
