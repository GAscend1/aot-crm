import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/config/roles";
import { getCrmUser } from "@/lib/server/api";

import { AppShell } from "@/components/layout/AppShell";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { AppProviders } from "./AppProviders";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = await getCrmUser();
  const role = (user?.role ?? "VIEWER") as UserRole;

  return (
    <SidebarProvider>
      <AppProviders>
        <AppShell
          sidebar={<AppSidebar role={role} />}
          navbar={<AppNavbar />}
        >
          {children}
        </AppShell>
      </AppProviders>
    </SidebarProvider>
  );
}
