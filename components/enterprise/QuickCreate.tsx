"use client";

import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  Plus,
  Users,
  Building2,
  Contact,
  Target,
  Briefcase,
  Ticket,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const quickActions = [
  { label: "New Customer", icon: Users, href: "/contacts?view=customers", description: "Add a new customer record" },
  { label: "New Company", icon: Building2, href: "/companies", description: "Add a new company" },
  { label: "New Contact", icon: Contact, href: "/contacts", description: "Add a new contact person" },
  { label: "New Lead", icon: Target, href: "/contacts?view=leads", description: "Capture a new sales lead" },
  { label: "New Opportunity", icon: Briefcase, href: "/opportunities", description: "Create a new deal" },
  { label: "New Ticket", icon: Ticket, href: "/tickets", description: "Create a support ticket" },
  { label: "New Document", icon: FileText, href: "/documents", description: "Upload a new document" },
];

interface QuickCreateProps {
  open: boolean;
  onClose: () => void;
}

export function QuickCreate({ open, onClose }: QuickCreateProps) {
  const router = useRouter();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="w-full max-w-md rounded-xl border bg-popover p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[color:var(--primary)]" />
                <h2 className="text-lg font-semibold text-foreground">Quick Create</h2>
              </div>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.href}
                    onClick={() => { router.push(action.href); onClose(); }}
                    className="flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-[color:var(--primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
