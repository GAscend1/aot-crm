"use client";

import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useSyncedNotifications } from "@/hooks/use-synced-notifications";

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
  const { notifications, unreadCount } = useSyncedNotifications();
  const recent = notifications.slice(0, 5);

  if (recent.length === 0) {
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
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
      }
    >
      <div className="-mx-6 -mb-6">
        {recent.map((notification, index) => {
          const Icon = typeIcons[notification.type];

          return (
            <div
              key={notification.id}
              className={`flex gap-3 px-6 py-3 ${
                index < recent.length - 1
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
                  {formatRelativeTime(notification.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
