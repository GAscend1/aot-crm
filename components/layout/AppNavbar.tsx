"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Search,
  Sun,
  User,
  Command,
  Compass,
  Crown,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { Breadcrumbs } from "@/components/enterprise/Breadcrumbs";
import { NotificationCenter } from "@/components/enterprise/NotificationCenter";
import { useTheme } from "@/components/enterprise/ThemeProvider";
import { useAppNotifications, useRestartOnboarding } from "@/app/(app)/AppProviders";
import { SupportModal } from "@/components/support/SupportModal";

export function AppNavbar() {
  const router = useRouter();
  const { toggle, toggleMobile } = useSidebar();
  const { toggle: toggleTheme, resolved: theme } = useTheme();
  const { data: session } = useSession();
  const restartOnboarding = useRestartOnboarding();
  const [supportOpen, setSupportOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
  } = useAppNotifications();
  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const openCommandPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      metaKey: false,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-3 lg:px-4">
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          className="hidden lg:flex"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMobile}
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <Suspense fallback={null}>
          <Breadcrumbs />
        </Suspense>
      </div>

      <div className="hidden max-w-sm flex-1 px-4 md:block">
        <button
          onClick={openCommandPalette}
          data-tour="global-search"
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-all duration-150 hover:border-ring/40 hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Search anything...</span>
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={openCommandPalette}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClear={clearNotifications}
          onRemove={removeNotification}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-1 flex items-center gap-2 rounded-lg p-1 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="User menu"
          >
            <Avatar size="sm">
              <AvatarImage src={user?.image ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={6} className="w-64">
            {/* Base UI requires GroupLabel to be inside a Group/RadioGroup —
                otherwise MenuGroupContext is missing and the whole navbar
                crashes with a runtime error. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex items-center gap-2.5">
                  <Avatar size="sm">
                    <AvatarImage src={user?.image ?? undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium">{user?.name ?? "User"}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {user?.email ?? ""}
                    </p>
                    {user?.isPlatformOwner && (
                      <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-[color:var(--warning)]">
                        <Crown className="h-3 w-3" aria-hidden />
                        Platform Owner
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                Appearance
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={openCommandPalette}>
                <Command className="mr-2 h-4 w-4" />
                Command Palette
                <kbd className="ml-auto text-[10px] text-muted-foreground">Ctrl+K</kbd>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setSupportOpen(true)}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuItem onClick={restartOnboarding}>
                <Compass className="mr-2 h-4 w-4" />
                Restart Product Tour
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onClick={() => void signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </header>
  );
}
