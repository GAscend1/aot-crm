"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { v4 as uuid } from "uuid";
import { CommandPalette } from "@/components/enterprise/CommandPalette";
import { QuickCreate } from "@/components/enterprise/QuickCreate";
import { ToastContainer } from "@/components/enterprise/Toast";
import { AppEventBridge } from "@/components/enterprise/AppEventBridge";
import { useSyncedNotifications } from "@/hooks/use-synced-notifications";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { Notification } from "@/types/common";

interface AppContextType {
  toasts: ReturnType<typeof useToast>["toasts"];
  removeToast: (id: string) => void;
  addNotification: (data: Omit<Notification, "id" | "timestamp" | "read">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  openCommandPalette: () => void;
  openQuickCreate: () => void;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useCommandPalette() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useCommandPalette must be inside AppProviders");
  return { open: ctx.openCommandPalette };
}

export function useQuickCreate() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useQuickCreate must be inside AppProviders");
  return { open: ctx.openQuickCreate };
}

export function useAppNotifications() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppNotifications must be inside AppProviders");
  return {
    notifications: ctx.notifications,
    unreadCount: ctx.unreadCount,
    markAsRead: ctx.markAsRead,
    markAllAsRead: ctx.markAllAsRead,
    clearNotifications: ctx.clearNotifications,
    removeNotification: ctx.removeNotification,
  };
}

export function useToastContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useToastContext must be inside AppProviders");
  return {
    toasts: ctx.toasts,
    removeToast: ctx.removeToast,
    success: ctx.success,
    error: ctx.error,
    info: ctx.info,
    warning: ctx.warning,
  };
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
  } = useSyncedNotifications();
  const { toasts, removeToast, success, error, info, warning } = useToast();

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const openQuickCreate = useCallback(() => {
    setQuickCreateOpen(true);
  }, []);

  const addNotification = useCallback(
    (data: Omit<Notification, "id" | "timestamp" | "read">) => {
      const notif: Notification = {
        ...data,
        id: uuid(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      try {
        const stored = JSON.parse(localStorage.getItem("crm-notifications") || "[]");
        stored.unshift(notif);
        localStorage.setItem("crm-notifications", JSON.stringify(stored.slice(0, 200)));
      } catch {}
      import("@/services/event-bus").then(({ eventBus }) => {
        eventBus.emit("notification:created", notif);
      });
    },
    []
  );

  useKeyboardShortcuts(
    [
      {
        key: "k",
        ctrl: true,
        handler: () => setCommandPaletteOpen((prev) => !prev),
      },
      {
        key: "k",
        meta: true,
        handler: () => setCommandPaletteOpen((prev) => !prev),
      },
      {
        key: "c",
        ctrl: true,
        shift: true,
        handler: () => setQuickCreateOpen((prev) => !prev),
      },
    ],
    true
  );

  return (
    <>
      <AppEventBridge />
      <AppContext.Provider
        value={{
          toasts,
          removeToast,
          addNotification,
          success,
          error,
          info,
          warning,
        openCommandPalette,
        openQuickCreate,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
      }}
    >
      {children}

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <QuickCreate
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </AppContext.Provider>
    </>
  );
}
