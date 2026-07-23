"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "aot-crm-sidebar-collapsed";

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return {
    collapsed,
    toggleSidebar: () => setCollapsed((prev) => !prev),
  };
}