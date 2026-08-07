import { redirect } from "next/navigation";

import { getCrmUser } from "@/lib/server/api";
import { isPlatformOwner } from "@/lib/server/tenant";
import { auth } from "@/auth";

import { MicrosoftIntegrationClient } from "./MicrosoftIntegrationClient";

export const dynamic = "force-dynamic";

/**
 * Microsoft 365 integration status — part of the SaaS Administration module,
 * therefore PLATFORM OWNER ONLY (same authorization as /administration).
 * Non-owners are redirected to the dashboard; the /api/integrations/microsoft/*
 * routes independently enforce the owner bypass + plan entitlements.
 */
export default async function MicrosoftIntegrationPage() {
  const user = await getCrmUser();
  if (!user) redirect("/login");

  const session = await auth();
  const tenantId = session?.user?.tenantId ?? null;

  if (!isPlatformOwner(user, tenantId)) {
    redirect("/dashboard");
  }

  return <MicrosoftIntegrationClient />;
}
