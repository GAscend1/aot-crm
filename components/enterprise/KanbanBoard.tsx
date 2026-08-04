"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

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
  /** Shows a green activity dot on the card. */
  hasActivity?: boolean;
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
  const reduceMotion = useReducedMotion();

  const handleDragStart = useCallback(
    (e: React.DragEvent, cardId: string) => {
      dragNode.current = e.target as HTMLElement;
      setDraggedCard(cardId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", cardId);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDragOverColumn(null);
    dragNode.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toColumnId: string) => {
      e.preventDefault();
      setDragOverColumn(null);
      const cardId = draggedCard || e.dataTransfer.getData("text/plain");
      if (!cardId) return;

      const fromColumn = columns.find((col) =>
        col.cards.some((c) => c.id === cardId)
      );
      if (!fromColumn) return;
      if (fromColumn.id === toColumnId) return;

      const toIndex = columns.find((col) => col.id === toColumnId)?.cards.length ?? 0;
      onCardMove(cardId, fromColumn.id, toColumnId, toIndex);
      setDraggedCard(null);
    },
    [draggedCard, columns, onCardMove]
  );

  return (
    <div className="flex h-full gap-3 overflow-x-auto pb-4 scrollbar-thin">
      {columns.map((column) => {
        const totalValue = column.cards.reduce(
          (sum, card) => sum + (typeof card.value === "number" ? card.value : 0),
          0
        );
        const isDropTarget = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            aria-label={`${column.title} stage`}
            className={cn(
              "flex min-w-[272px] max-w-[320px] flex-1 flex-col rounded-xl border bg-muted/40 transition-colors duration-150",
              isDropTarget && "border-[color:var(--primary)] bg-primary-soft/40"
            )}
          >
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-foreground">
                  {column.title}
                </h3>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                  {column.cards.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="hidden text-[11px] text-muted-foreground tabular-nums md:inline">
                  ${totalValue.toLocaleString()}
                </span>
                {onAddClick && (
                  <button
                    type="button"
                    onClick={() => onAddClick(column.id)}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Add opportunity to ${column.title}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-2.5 scrollbar-thin">
              <AnimatePresence initial={false}>
                {column.cards.map((card) => {
                  const isDragging = draggedCard === card.id;
                  return (
                    <motion.div
                      key={card.id}
                      layout={!reduceMotion}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      onClick={() => onCardClick?.(card.id)}
                      onKeyDown={(e) => {
                        if (onCardClick && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onCardClick(card.id);
                        }
                      }}
                      role={onCardClick ? "button" : undefined}
                      tabIndex={onCardClick ? 0 : undefined}
                      aria-label={`${card.title}, ${column.title}`}
                      className={cn(
                        "rounded-xl",
                        onCardClick &&
                          "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      )}
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "cursor-grab rounded-xl border bg-surface-raised p-3 transition-all duration-150 active:cursor-grabbing",
                          isDragging
                            ? "z-10 cursor-grabbing opacity-80 shadow-lg"
                            : "shadow-sm hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical
                            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50"
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {card.title}
                            </p>
                            {card.hasActivity && (
                              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-[color:var(--success)]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
                                Active
                              </span>
                            )}
                            {card.subtitle && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {card.subtitle}
                              </p>
                            )}
                            {card.company && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                                {card.company}
                              </p>
                            )}
                            {card.priority && (
                              <span
                                className={cn(
                                  "mt-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                                  /high|urgent/i.test(card.priority)
                                    ? "bg-danger-soft text-[color:var(--danger)] ring-danger/20"
                                    : /low/i.test(card.priority)
                                      ? "bg-muted text-muted-foreground ring-border"
                                      : "bg-warning-soft text-[color:var(--warning)] ring-warning/20"
                                )}
                              >
                                {card.priority}
                              </span>
                            )}
                            {card.value !== undefined && (
                              <p className="mt-2 text-sm font-semibold text-foreground tabular-nums">
                                {typeof card.value === "number"
                                  ? `$${card.value.toLocaleString()}`
                                  : card.value}
                              </p>
                            )}
                            {card.probability !== undefined && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-[color:var(--primary)]"
                                    style={{ width: `${card.probability}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                                  {card.probability}%
                                </span>
                              </div>
                            )}
                            {card.tags && card.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {card.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {(card.expectedClose || card.assignee) && (
                              <div className="mt-2 flex items-center justify-between gap-2">
                                {card.expectedClose && (
                                  <span className="text-[11px] text-muted-foreground tabular-nums">
                                    Close {card.expectedClose}
                                  </span>
                                )}
                                {card.assignee && (
                                  <span className="truncate text-[11px] text-muted-foreground">
                                    {card.assignee}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
