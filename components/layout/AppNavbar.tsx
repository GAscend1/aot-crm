"use client";

import {
  Bell,
  Menu,
  PanelLeft,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/SidebarProvider";

export function AppNavbar() {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="hidden lg:flex"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h2 className="text-lg font-semibold">
          Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </div>
    </header>
  );
}