import { redirect } from "next/navigation";

import { PageLayout } from "@/components/common/PageLayout";
import { getCrmUser } from "@/lib/server/api";
import { isPlatformOwner } from "@/lib/server/tenant";
import { auth } from "@/auth";
import { Crown } from "lucide-react";

import { AdminStats } from "./components/AdminStats";
import { AdminTable } from "./components/AdminTable";
import { PlatformOwnerSection } from "./components/PlatformOwnerSection";

export const dynamic = "force-dynamic";

/**
 * Administration is the AOT SaaS PLATFORM OWNER module — owner only.
 *
 * Ownership is decided by the verified Microsoft Entra tid from the
 * authenticated session compared with AOT_PLATFORM_TENANT_ID — never by the
 * CRM workspace role, organization ownership, plan, or tenant admin status.
 * Being an Enterprise customer, an organization owner, an organization admin,
 * or even a Microsoft Entra administrator in a customer tenant does NOT make
 * someone the AOT SaaS Platform Owner.
 *
 * Non-owners are safely redirected to the dashboard. The navigation item is
 * filtered out of every discovery surface (sidebar, mobile, command palette,
 * tour) for non-owners, so no disabled entry or restricted-state notice is
 * ever shown. The /api/platform/* routes independently return 403.
 */
export default async function AdministrationPage() {
  const user = await getCrmUser();
  if (!user) redirect("/login");

  // Verified Microsoft Entra tid from the authenticated session (never the
  // browser) — the PRIMARY Platform Owner authorization input.
  const session = await auth();
  const tenantId = session?.user?.tenantId ?? null;

  if (!isPlatformOwner(user, tenantId)) {
    redirect("/dashboard");
  }

  return (
    <PageLayout
      title="Administration"
      description="Manage users, roles, customer organizations, trials and subscriptions."
    >
      <AdminStats />

      <AdminTable />

      <div className="flex items-center gap-2 border-t border-border pt-6">
        <Crown className="h-4 w-4 text-[color:var(--warning)]" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Platform Owner
        </h2>
        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-[color:var(--warning)]">
          AOT only
        </span>
      </div>
      <PlatformOwnerSection />
    </PageLayout>
  );
}
