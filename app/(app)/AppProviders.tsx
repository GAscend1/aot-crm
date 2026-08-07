"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import dynamic from "next/dynamic";
import { v4 as uuid } from "uuid";
import { ToastContainer } from "@/components/enterprise/Toast";
import { AppEventBridge } from "@/components/enterprise/AppEventBridge";

// Lazy-load the heavy modal surfaces — they are only interactive when opened,
// so deferring them keeps the initial app bundle small (route-level split).
const CommandPalette = dynamic(
  () => import("@/components/enterprise/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);
const QuickCreate = dynamic(
  () => import("@/components/enterprise/QuickCreate").then((m) => m.QuickCreate),
  { ssr: false },
);
const ProductTour = dynamic(
  () => import("@/components/onboarding/ProductTour").then((m) => m.ProductTour),
  { ssr: false },
);
import { useSyncedNotifications } from "@/hooks/use-synced-notifications";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useOnboarding } from "@/hooks/use-onboarding";
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
  restartOnboarding: () => void;
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

export function useRestartOnboarding() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useRestartOnboarding must be inside AppProviders");
  return ctx.restartOnboarding;
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
  const {
    loaded: onboardingLoaded,
    mode: onboardingMode,
    stepIndex: onboardingStepIndex,
    startTour,
    skip: skipOnboarding,
    neverShowAgain,
    complete: completeOnboarding,
    handleStepChange,
    restart,
  } = useOnboarding();

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

  // First-time user flow: the onboarding wizard dispatches
  // `aot:onboarding-complete` when it finishes — auto-start the guided tour so
  // the user moves straight from setup into the tour (never stuck discovering
  // the Dashboard Get Started card first).
  useEffect(() => {
    const onOnboardingComplete = () => {
      void startTour();
    };
    window.addEventListener("aot:onboarding-complete", onOnboardingComplete);
    return () =>
      window.removeEventListener("aot:onboarding-complete", onOnboardingComplete);
  }, [startTour]);

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
        restartOnboarding: restart,
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

      {onboardingLoaded && (
        <ProductTour
          open={onboardingMode !== null}
          mode={onboardingMode ?? "tour"}
          stepIndex={onboardingStepIndex}
          onStart={() => void startTour()}
          onSkip={() => void skipOnboarding()}
          onNeverShowAgain={() => void neverShowAgain()}
          onStepChange={(index) => void handleStepChange(index)}
          onComplete={() => void completeOnboarding()}
        />
      )}
    </AppContext.Provider>
    </>
  );
}
