"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type SidebarContextType = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const value = localStorage.getItem("crm-sidebar");

    if (value) {
      setCollapsed(value === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "crm-sidebar",
      String(collapsed)
    );
  }, [collapsed]);

  const toggle = () => setCollapsed(!collapsed);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggle,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context)
    throw new Error(
      "SidebarProvider missing."
    );

  return context;
}