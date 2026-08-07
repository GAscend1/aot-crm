import { getCrmUser } from "@/lib/server/api";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Welcome",
};

/**
 * First-time user setup: role selection → sample data → notification
 * preferences. Reachable from the welcome modal or directly at /onboarding.
 * The `(app)` layout already guards auth, so we can safely read the CRM user.
 */
export default async function OnboardingPage() {
  const user = await getCrmUser();
  const initialRole = user?.role ?? null;

  return (
    <div className="min-h-full px-4 py-10 sm:px-6 lg:py-16">
      <OnboardingWizard initialRole={initialRole} />
    </div>
  );
}
