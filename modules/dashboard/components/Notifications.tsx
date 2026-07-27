import {
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";

import { notifications } from "../mockData";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
} as const;

const typeColors = {
  info: "bg-blue-100 text-blue-600",
  warning: "bg-amber-100 text-amber-600",
  success: "bg-green-100 text-green-600",
  error: "bg-red-100 text-red-600",
} as const;

export function Notifications() {
  const unread = notifications.filter((n) => !n.read).length;

  if (notifications.length === 0) {
    return (
      <SectionCard title="Notifications">
        <EmptyState
          title="No notifications"
          description="You're all caught up!"
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={
        <div className="flex items-center gap-2">
          <span>Notifications</span>
          {unread > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {unread}
            </span>
          )}
        </div>
      }
    >
      <div className="-mx-6 -mb-6">
        {notifications.map((notification, index) => {
          const Icon = typeIcons[notification.type];

          return (
            <div
              key={notification.id}
              className={`flex gap-3 px-6 py-3 ${
                index < notifications.length - 1
                  ? "border-b border-slate-100"
                  : ""
              } ${!notification.read ? "bg-blue-50/50" : ""}`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  typeColors[notification.type]
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {notification.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {notification.message}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {notification.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
