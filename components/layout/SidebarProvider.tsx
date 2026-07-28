"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type SidebarContextType = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

function getStored(key: string, fallback: boolean): boolean {
  if (typeof window !== "undefined") {
    const val = localStorage.getItem(key);
    if (val !== null) return val === "true";
  }
  return fallback;
}

function setStored(key: string, value: boolean) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, String(value));
  }
}

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(() => getStored("crm-sidebar", false));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setStored("crm-sidebar", collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const toggle = useCallback(() => setCollapsed((v) => !v), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, mobileOpen, toggle, toggleMobile, closeMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("SidebarProvider missing.");
  return context;
}
