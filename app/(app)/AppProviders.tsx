"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { CommandPalette } from "@/components/enterprise/CommandPalette";
import { ToastContainer } from "@/components/enterprise/Toast";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

type NotificationsAPI = ReturnType<typeof useNotifications>;

interface AppContextType {
  toasts: ReturnType<typeof useToast>["toasts"];
  removeToast: (id: string) => void;
  addNotification: NotificationsAPI["addNotification"];
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  openCommandPalette: () => void;
  notifications: NotificationsAPI["notifications"];
  unreadCount: NotificationsAPI["unreadCount"];
  markAsRead: NotificationsAPI["markAsRead"];
  markAllAsRead: NotificationsAPI["markAllAsRead"];
  clearNotifications: NotificationsAPI["clearNotifications"];
  removeNotification: NotificationsAPI["removeNotification"];
}

const AppContext = createContext<AppContextType | null>(null);

export function useCommandPalette() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useCommandPalette must be inside AppProviders");
  return { open: ctx.openCommandPalette };
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
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
  } = useNotifications();
  const { toasts, removeToast, success, error, info, warning } = useToast();

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

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
    ],
    true
  );

  return (
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

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </AppContext.Provider>
  );
}
