"use client";

import { useState, useCallback } from "react";
import { v4 as uuid } from "uuid";

interface Toast {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message?: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (data: Omit<Toast, "id">) => {
      const toast: Toast = { ...data, id: uuid() };
      setToasts((prev) => [...prev, toast]);

      const duration = data.duration ?? 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, duration);

      return toast.id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, info, warning };
}
