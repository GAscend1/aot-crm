"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RecordModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional footer actions. If not provided, the modal will have no footer. */
  footer?: ReactNode;
  /** Size variant. Defaults to "md". */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  loading?: boolean;
  className?: string;
  /** Whether to show the close button. Defaults to true. */
  showCloseButton?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100dvh-2rem)]",
};

/**
 * Centered modal for record CRUD operations.
 * Supports Escape key, focus trapping, and responsive full-screen on mobile.
 *
 * Uses @base-ui/react/dialog primitives for accessibility.
 */
export function RecordModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  loading,
  className,
  showCloseButton = true,
}: RecordModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/45 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs"
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl outline-none transition duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0 space-y-0.5">
              <DialogPrimitive.Title className="text-base font-semibold leading-6 text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {showCloseButton && (
              <DialogPrimitive.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label="Close"
                  />
                }
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-[color:var(--primary)]" />
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              children
            )}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              {footer}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}