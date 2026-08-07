"use client";

import { AlertTriangle, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
  onConfirm: () => void;
}

const iconMap = {
  danger: { icon: AlertTriangle, className: "text-[color:var(--danger)]" },
  warning: { icon: AlertTriangle, className: "text-[color:var(--warning)]" },
  info: { icon: AlertTriangle, className: "text-[color:var(--info)]" },
};

/**
 * Centered confirmation dialog for destructive or important actions.
 * Provides escape-key close, backdrop click close, and focus trapping.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const Icon = iconMap[variant].icon;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/45 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs"
        />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-xl outline-none transition duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
        >
          {/* Visible close — delete confirmations get X + Cancel + Delete. */}
          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 shrink-0"
                aria-label="Close"
              />
            }
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                variant === "danger" && "bg-danger-soft",
                variant === "warning" && "bg-warning-soft",
                variant === "info" && "bg-info-soft"
              )}
            >
              <Icon className={cn("h-5 w-5", iconMap[variant].className)} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-semibold leading-6 text-foreground">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                {message}
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <DialogPrimitive.Close
              render={<Button variant="outline" disabled={loading} />}
            >
              {cancelLabel}
            </DialogPrimitive.Close>
            <Button
              variant={variant === "danger" ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}