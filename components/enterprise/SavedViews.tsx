"use client";

import { useState, useCallback } from "react";
import { Check, Trash2, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SavedView {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface SavedViewsProps {
  views: SavedView[];
  activeViewId?: string;
  onSelectView: (id: string) => void;
  onSaveView: (name: string) => void;
  onDeleteView: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function SavedViews({
  views,
  activeViewId,
  onSelectView,
  onSaveView,
  onDeleteView,
}: SavedViewsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSave = useCallback(() => {
    if (newName.trim()) {
      onSaveView(newName.trim());
      setNewName("");
      setIsCreating(false);
    }
  }, [newName, onSaveView]);

  return (
    <div className="flex items-center gap-1">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onSelectView(view.id)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeViewId === view.id
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {view.isDefault && <Check className="h-3 w-3" />}
          {view.name}
          {activeViewId === view.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteView(view.id);
              }}
              className="ml-1 rounded p-0.5 hover:bg-slate-700 dark:hover:bg-slate-300"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </button>
      ))}

      <AnimatePresence>
        {isCreating ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center gap-1 overflow-hidden"
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setIsCreating(false);
              }}
              placeholder="View name..."
              className="h-7 w-32 text-xs"
              autoFocus
            />
            <Button size="icon-xs" variant="ghost" onClick={handleSave}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon-xs" variant="ghost" onClick={() => setIsCreating(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        ) : (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsCreating(true)}
            title="Save current view"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
}
