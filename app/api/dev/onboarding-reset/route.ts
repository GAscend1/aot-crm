import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";

/**
 * DEVELOPMENT ONLY — first-time user flow reset for the current test account.
 *
 * Resets: onboarding completion/step, product tour, getting-started checklist
 * and the matching OnboardingState row. It NEVER deletes CRM records
 * (companies, contacts, leads, opportunities, activities, ...) — only the
 * first-run UI state, so the next login shows the onboarding wizard + tour.
 *
 * Hard-blocked in production (NODE_ENV=production) — this must never be
 * exposed to real customers.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const user = await getCrmUser();
  if (!user) return unauthorized();

  try {
    // Clear the onboarding/tour/getting-started state on the user row.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingStartedAt: null,
        onboardingCompletedAt: null,
        onboardingDismissedAt: null,
        onboardingNeverShowAgain: false,
        onboardingLastStep: 1,
      },
    });

    // Clear the SaaS onboarding progress row if present.
    await prisma.onboardingState
      .update({
        where: { userId: user.id },
        data: {
          currentStep: 1,
          completed: false,
          tourCompleted: false,
          gettingStartedDismissedAt: null,
          completedAt: null,
        },
      })
      .catch(() => {});

    return NextResponse.json({
      data: {
        reset: true,
        message:
          "Onboarding reset. Sign out and sign back in to experience the first-login flow again.",
      },
    });
  } catch (err) {
    logServerError("POST /api/dev/onboarding-reset", err);
    return serverError("Failed to reset onboarding");
  }
}
