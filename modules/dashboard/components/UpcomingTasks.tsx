"use client";

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const priorityColors: Record<string, string> = {
  High: "text-[color:var(--danger)]",
  Medium: "text-[color:var(--warning)]",
  Low: "text-muted-foreground",
};

export function UpcomingTasks() {
  const { recentTasks } = useDashboardData();

  const activeTasks = recentTasks.filter((t) => t.status !== "Completed");
  const completedTasks = recentTasks.filter((t) => t.status === "Completed");

  if (recentTasks.length === 0) {
    return (
      <SectionCard title="Upcoming Tasks">
        <EmptyState
          title="No tasks"
          description="Tasks assigned to you will appear here."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Upcoming Tasks">
      <div className="-mx-6 -mb-6">
        {activeTasks.map((task, index: number) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 px-6 py-3 ${
              index < activeTasks.length - 1 || completedTasks.length > 0
                ? "border-b border-border"
                : ""
            }`}
          >
            <Circle className={`mt-0.5 h-4 w-4 shrink-0 ${task.overdue ? "text-[color:var(--danger)]" : "text-muted-foreground/40"}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${task.overdue ? "text-[color:var(--danger)]" : "text-foreground"}`}>
                {task.subject}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{task.assignee || "Unassigned"}</span>
                <span>·</span>
                {task.overdue ? (
                  <span className="font-medium text-[color:var(--danger)]">Overdue</span>
                ) : (
                  <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${priorityColors[task.priority] || "text-muted-foreground"}`} />
          </div>
        ))}
        {completedTasks.length > 0 && (
          <>
            <div className="border-b border-border px-6 py-2">
              <p className="text-xs font-medium text-muted-foreground">Completed</p>
            </div>
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 px-6 py-3 opacity-60"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground line-through">
                    {task.subject}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{task.assignee || "Unassigned"}</span>
                    <span>·</span>
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </SectionCard>
  );
}
