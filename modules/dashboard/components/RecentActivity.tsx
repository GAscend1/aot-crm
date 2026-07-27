import {
  Users,
  Briefcase,
  Ticket,
  Target,
  CheckSquare,
} from "lucide-react";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";

import { recentActivities } from "../mockData";

const typeIcons = {
  customer: Users,
  opportunity: Briefcase,
  ticket: Ticket,
  lead: Target,
  task: CheckSquare,
} as const;

const typeColors = {
  customer: "bg-blue-100 text-blue-600",
  opportunity: "bg-amber-100 text-amber-600",
  ticket: "bg-purple-100 text-purple-600",
  lead: "bg-green-100 text-green-600",
  task: "bg-slate-100 text-slate-600",
} as const;

export function RecentActivity() {
  if (recentActivities.length === 0) {
    return (
      <SectionCard title="Recent Activity">
        <EmptyState
          title="No activity yet"
          description="Recent CRM activity will appear here once users begin interacting with the system."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Activity">
      <div className="-mx-6 -mb-6">
        {recentActivities.map((activity, index) => {
          const Icon = typeIcons[activity.type];

          return (
            <div
              key={activity.id}
              className={`flex gap-4 px-6 py-4 ${
                index < recentActivities.length - 1
                  ? "border-b border-slate-100"
                  : ""
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  typeColors[activity.type]
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{activity.subject}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span>{activity.user}</span>
                  <span>·</span>
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
