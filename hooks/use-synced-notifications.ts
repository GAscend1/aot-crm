"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { synchronizedNotificationService } from "@/services/synchronized-notification.service";
import type { Notification } from "@/types/common";

/**
 * Server-backed notifications that also merge in locally emitted events
 * (calendar, meetings, emails) so the bell always reflects both sources.
 * Persists read/unread state to PostgreSQL through the API.
 */
/**
 * Whether the user has opted in to in-app notifications. Defaults to on;
 * the onboarding wizard and profile settings write the `aot-notifications-enabled`
 * key. When disabled, server polling is paused (local events still work).
 */
export function notificationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem("aot-notifications-enabled") !== "false";
  } catch {
    return true;
  }
}

export function useSyncedNotifications() {
  // Deterministic initial state: SSR and the FIRST client render must produce
  // identical DOM (the NotificationCenter unread badge previously differed
  // because this initializer read localStorage on the client but not the
  // server → hydration mismatch). The mount effect below immediately merges
  // server notifications AND any local ones via subscribe(), so the badge
  // appears right after hydration without a mismatch.
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [serverLoaded, setServerLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // Deterministic initial value (true): reading the localStorage preference in
  // the initializer would diverge from the server snapshot on first render
  // (same hydration-mismatch class as the badge). The mount effect syncs the
  // real preference immediately after hydration.
  const [enabled, setEnabled] = useState(true);
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
      // Sync the persisted opt-in preference here (async scope, post-hydration)
      // so the initial state stays deterministic — never a synchronous
      // setState inside the effect body (react-hooks/set-state-in-effect).
      setEnabled(notificationsEnabled());
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
    // Respect the onboarding/profile opt-in preference. When disabled we pause
    // server polling (local events keep flowing through the service).
    void fetchFromServer();
    if (enabled) {
      refreshTimer.current = setInterval(() => void fetchFromServer(), 15000);
    }
    const unsub = synchronizedNotificationService.subscribe(handleLocalUpdate);
    // React to preference changes from the wizard/settings in other tabs or
    // same-tab navigation (custom event dispatched by the onboarding wizard).
    const onPrefChange = () => {
      setEnabled(notificationsEnabled());
    };
    window.addEventListener("storage", onPrefChange);
    window.addEventListener("aot:notifications-pref-change", onPrefChange);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      cancelled = true;
      unsub();
      window.removeEventListener("storage", onPrefChange);
      window.removeEventListener("aot:notifications-pref-change", onPrefChange);
    };
  }, [handleLocalUpdate, refreshKey, enabled]);

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
    enabled,
    refresh: useCallback(() => setRefreshKey((k) => k + 1), []),
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
  };
}
