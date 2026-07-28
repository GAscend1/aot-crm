"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Search, Command, FileText, Users, Settings, BarChart3, Layers, Tag } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: typeof Command;
  category: string;
  shortcut?: string;
}

const commands: CommandItem[] = [
  { id: "leads", label: "View Leads", icon: Users, category: "Navigation" },
  { id: "opportunities", label: "View Opportunities", icon: BarChart3, category: "Navigation" },
  { id: "pipeline", label: "View Pipeline", icon: Layers, category: "Navigation" },
  { id: "reports", label: "View Reports", icon: FileText, category: "Navigation" },
  { id: "settings", label: "Settings", icon: Settings, category: "Navigation" },
  { id: "new-lead", label: "New Lead", icon: Users, category: "Actions", shortcut: "N" },
  { id: "new-deal", label: "New Deal", icon: Tag, category: "Actions", shortcut: "D" },
  { id: "search", label: "Global Search", icon: Search, category: "Actions", shortcut: "/" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
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
        console.log("Command selected:", filtered[selectedIndex].id);
        onClose();
      }
    },
    [filtered, selectedIndex, onClose]
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
          <div className="flex items-center gap-2 border-b px-4 dark:border-slate-800">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search commands..."
              className="h-12 w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white"
            />
            <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-sm text-slate-500">
                <Search className="h-6 w-6" />
                <p>No results found</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((cmd, index) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        console.log("Command selected:", cmd.id);
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        index === selectedIndex
                          ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1">
                        <span>{cmd.label}</span>
                        <span className="ml-2 text-[10px] text-slate-400">
                          {cmd.category}
                        </span>
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
            )}
          </div>
        </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
