import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { AppProviders } from "./AppProviders";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppProviders>
        <AppShell
          sidebar={<AppSidebar />}
          navbar={<AppNavbar />}
        >
          {children}
        </AppShell>
      </AppProviders>
    </SidebarProvider>
  );
}
