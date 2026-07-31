"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GripVertical } from "lucide-react";

interface KanbanCard {
  id: string;
  title: string;
  subtitle?: string;
  company?: string;
  priority?: string;
  expectedClose?: string;
  value?: string | number;
  probability?: number;
  assignee?: string;
  tags?: string[];
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove: (cardId: string, fromColumn: string, toColumn: string, toIndex: number) => void;
  onCardClick?: (cardId: string) => void;
  onAddClick?: (columnId: string) => void;
}

export function KanbanBoard({
  columns,
  onCardMove,
  onCardClick,
  onAddClick,
}: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback(
    (e: globalThis.DragEvent | globalThis.MouseEvent | globalThis.TouchEvent | globalThis.PointerEvent, cardId: string) => {
      dragNode.current = e.target as HTMLElement;
      setDraggedCard(cardId);
      if ("dataTransfer" in e && e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toColumnId: string) => {
      e.preventDefault();
      setDragOverColumn(null);
      if (!draggedCard) return;

      const fromColumn = columns.find((col) =>
        col.cards.some((c) => c.id === draggedCard)
      );
      if (!fromColumn) return;
      if (fromColumn.id === toColumnId) return;

      const toIndex = columns.find((col) => col.id === toColumnId)?.cards.length ?? 0;
      onCardMove(draggedCard, fromColumn.id, toColumnId, toIndex);
      setDraggedCard(null);
    },
    [draggedCard, columns, onCardMove]
  );

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
          className={`flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-xl border bg-slate-50 transition-colors dark:bg-slate-900/50 dark:border-slate-700 ${
            dragOverColumn === column.id
              ? "border-blue-400 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/20"
              : ""
          }`}
        >
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {column.title}
              </h3>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {column.cards.length}
              </span>
            </div>
            {onAddClick && (
              <button
                onClick={() => onAddClick(column.id)}
                className="rounded-lg p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Plus className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            <AnimatePresence>
              {column.cards.map((card) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  onClick={() => onCardClick?.(card.id)}
                  className={`cursor-grab rounded-xl border bg-white p-4 shadow-sm active:cursor-grabbing hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-600 ${
                    draggedCard === card.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {card.title}
                      </p>
                      {card.subtitle && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {card.subtitle}
                        </p>
                      )}
                      {card.company && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {card.company}
                        </p>
                      )}
                      {card.priority && (
                        <span
                          className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            card.priority === "High"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : card.priority === "Urgent"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : card.priority === "Low"
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          }`}
                        >
                          {card.priority}
                        </span>
                      )}
                      {card.value && (
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {typeof card.value === "number"
                            ? `$${card.value.toLocaleString()}`
                            : card.value}
                        </p>
                      )}
                      {card.probability !== undefined && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-1.5 rounded-full bg-blue-600"
                              style={{ width: `${card.probability}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-slate-500">
                            {card.probability}%
                          </span>
                        </div>
                      )}
                      {card.tags && card.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {card.expectedClose && (
                        <p className="mt-2 text-[11px] text-slate-400">
                          Close: {card.expectedClose}
                        </p>
                      )}
                      {card.assignee && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {card.assignee}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
