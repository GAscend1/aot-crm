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
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
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
    <div className="rounded-xl border bg-surface-raised shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
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
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">
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
