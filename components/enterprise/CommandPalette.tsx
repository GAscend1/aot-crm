"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  Search,
  Command,
  FileText,
  Users,
  Settings,
  BarChart3,
  Layers,
  Tag,
  LayoutDashboard,
  Building2,
  Contact,
  Target,
  Briefcase,
  Ticket,
  FolderOpen,
  Plus,
  User,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import clsx from "clsx";

interface CommandItem {
  id: string;
  label: string;
  icon: typeof Command;
  category: string;
  href?: string;
  shortcut?: string;
}

const commands: CommandItem[] = [
  { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, category: "Navigation", href: "/dashboard" },
  { id: "customers", label: "View Customers", icon: Users, category: "Navigation", href: "/customers" },
  { id: "companies", label: "View Companies", icon: Building2, category: "Navigation", href: "/companies" },
  { id: "contacts", label: "View Contacts", icon: Contact, category: "Navigation", href: "/contacts" },
  { id: "leads", label: "View Leads", icon: Target, category: "Navigation", href: "/leads" },
  { id: "opportunities", label: "View Opportunities", icon: Briefcase, category: "Navigation", href: "/opportunities" },
  { id: "pipeline", label: "View Pipeline", icon: Layers, category: "Navigation", href: "/opportunities/kanban" },
  { id: "activities", label: "View Activities", icon: ClipboardList, category: "Navigation", href: "/activities" },
  { id: "calendar", label: "View Calendar", icon: CalendarDays, category: "Navigation", href: "/activities/calendar" },
  { id: "tickets", label: "View Tickets", icon: Ticket, category: "Navigation", href: "/tickets" },
  { id: "documents", label: "View Documents", icon: FolderOpen, category: "Navigation", href: "/documents" },
  { id: "reports", label: "View Reports", icon: FileText, category: "Navigation", href: "/reports" },
  { id: "settings", label: "Administration", icon: Settings, category: "Navigation", href: "/administration" },
  { id: "profile", label: "My Profile", icon: User, category: "Navigation", href: "/profile" },
  { id: "new-customer", label: "New Customer", icon: Plus, category: "Quick Create", href: "/customers", shortcut: "C" },
  { id: "new-contact", label: "New Contact", icon: Plus, category: "Quick Create", href: "/contacts", shortcut: "N" },
  { id: "new-lead", label: "New Lead", icon: Plus, category: "Quick Create", href: "/leads", shortcut: "L" },
  { id: "new-opportunity", label: "New Opportunity", icon: Plus, category: "Quick Create", href: "/opportunities", shortcut: "O" },
  { id: "new-ticket", label: "New Ticket", icon: Plus, category: "Quick Create", href: "/tickets", shortcut: "T" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(search.toLowerCase()) ||
          cmd.category.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const execute = useCallback(
    (cmd: CommandItem) => {
      if (cmd.href) router.push(cmd.href);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        execute(filtered[selectedIndex]);
      }
    },
    [filtered, selectedIndex, execute]
  );

  const categories = Array.from(new Set(filtered.map((c) => c.category)));

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center gap-2 border-b px-4 dark:border-slate-800">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands..."
                className="h-12 w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white"
              />
              <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700">ESC</kbd>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-sm text-slate-500">
                  <Search className="h-6 w-6" />
                  <p>No results found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {category}
                      </div>
                      {filtered
                        .filter((c) => c.category === category)
                        .map((cmd, index) => {
                          const globalIndex = filtered.indexOf(cmd);
                          const Icon = cmd.icon;
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => execute(cmd)}
                              className={clsx(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                globalIndex === selectedIndex
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <div className="flex-1">
                                <span>{cmd.label}</span>
                              </div>
                              {cmd.shortcut && (
                                <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
