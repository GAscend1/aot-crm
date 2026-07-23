import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <AppShell
      sidebar={<AppSidebar />}
      navbar={<AppNavbar />}
    >
      {children}
    </AppShell>
  );
}