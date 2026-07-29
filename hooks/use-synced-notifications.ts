"use client";

import { useState, useEffect } from "react";
import { synchronizedNotificationService } from "@/services/synchronized-notification.service";
import type { Notification } from "@/types/common";

export function useSyncedNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    synchronizedNotificationService.getAll()
  );

  useEffect(() => {
    const unsub = synchronizedNotificationService.subscribe(setNotifications);
    return unsub;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead: (id: string) => synchronizedNotificationService.markAsRead(id),
    markAllAsRead: () => synchronizedNotificationService.markAllAsRead(),
    clearNotifications: () => synchronizedNotificationService.clear(),
    removeNotification: (id: string) => synchronizedNotificationService.remove(id),
  };
}
