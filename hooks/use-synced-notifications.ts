"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { synchronizedNotificationService } from "@/services/synchronized-notification.service";
import type { Notification } from "@/types/common";

/**
 * Server-backed notifications that also merge in locally emitted events
 * (calendar, meetings, emails) so the bell always reflects both sources.
 * Persists read/unread state to PostgreSQL through the API.
 */
export function useSyncedNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    synchronizedNotificationService.getAll()
  );
  const [serverLoaded, setServerLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLocalUpdate = useCallback((local: Notification[]) => {
    setNotifications((prev) => {
      const merged = [...prev];
      for (const n of local) {
        if (!merged.some((m) => m.id === n.id)) merged.push(n);
      }
      return merged;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchFromServer() {
      try {
        const res = await fetch("/api/notifications?limit=100", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as { data: Notification[]; unreadCount: number };
        if (cancelled) return;
        // Merge server notifications with any locally-emitted ones (dedupe by id).
        const local = synchronizedNotificationService.getAll();
        const merged: Notification[] = [...(body.data ?? [])];
        for (const n of local) {
          if (!merged.some((m) => m.id === n.id)) merged.push(n);
        }
        setNotifications(merged);
        setServerLoaded(true);
      } catch {
        /* offline / unauthenticated: keep local state */
      }
    }
    void fetchFromServer();
    refreshTimer.current = setInterval(() => void fetchFromServer(), 15000);
    const unsub = synchronizedNotificationService.subscribe(handleLocalUpdate);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      cancelled = true;
      unsub();
    };
  }, [handleLocalUpdate, refreshKey]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    synchronizedNotificationService.markAsRead(id);
    void fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    synchronizedNotificationService.markAllAsRead();
    void fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    synchronizedNotificationService.clear();
    void fetch("/api/notifications", { method: "DELETE" }).catch(() => {});
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    synchronizedNotificationService.remove(id);
    void fetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    serverLoaded,
    refresh: useCallback(() => setRefreshKey((k) => k + 1), []),
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
  };
}
