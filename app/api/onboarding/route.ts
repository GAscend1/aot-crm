import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

export interface OnboardingState {
  onboardingStartedAt: string | null;
  onboardingCompletedAt: string | null;
  onboardingDismissedAt: string | null;
  onboardingNeverShowAgain: boolean;
  onboardingLastStep: number;
}

/**
 * Returns the current user's onboarding state (from PostgreSQL).
 * Used by the first-time user experience to decide whether to show the tour.
 */
export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    return NextResponse.json({
      onboardingStartedAt: user.onboardingStartedAt?.toISOString() ?? null,
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      onboardingDismissedAt: user.onboardingDismissedAt?.toISOString() ?? null,
      onboardingNeverShowAgain: user.onboardingNeverShowAgain,
      onboardingLastStep: user.onboardingLastStep,
    } satisfies OnboardingState);
  } catch (err) {
    logServerError("GET /api/onboarding", err);
    return serverError("Failed to fetch onboarding state");
  }
}

/**
 * Updates the current user's onboarding progress.
 * Supports: started, completed, dismissed, neverShowAgain, lastStep.
 */
export async function PATCH(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<OnboardingState>;
    const data: Record<string, unknown> = {};

    if ("onboardingStartedAt" in body) {
      data.onboardingStartedAt = body.onboardingStartedAt ? new Date(body.onboardingStartedAt) : null;
    }
    if ("onboardingCompletedAt" in body) {
      data.onboardingCompletedAt = body.onboardingCompletedAt ? new Date(body.onboardingCompletedAt) : null;
    }
    if ("onboardingDismissedAt" in body) {
      data.onboardingDismissedAt = body.onboardingDismissedAt ? new Date(body.onboardingDismissedAt) : null;
    }
    if ("onboardingNeverShowAgain" in body) {
      data.onboardingNeverShowAgain = Boolean(body.onboardingNeverShowAgain);
    }
    if ("onboardingLastStep" in body && typeof body.onboardingLastStep === "number") {
      data.onboardingLastStep = Math.max(1, Math.floor(body.onboardingLastStep));
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        onboardingStartedAt: true,
        onboardingCompletedAt: true,
        onboardingDismissedAt: true,
        onboardingNeverShowAgain: true,
        onboardingLastStep: true,
      },
    });

    return NextResponse.json({
      onboardingStartedAt: updated.onboardingStartedAt?.toISOString() ?? null,
      onboardingCompletedAt: updated.onboardingCompletedAt?.toISOString() ?? null,
      onboardingDismissedAt: updated.onboardingDismissedAt?.toISOString() ?? null,
      onboardingNeverShowAgain: updated.onboardingNeverShowAgain,
      onboardingLastStep: updated.onboardingLastStep,
    } satisfies OnboardingState);
  } catch (err) {
    logServerError("PATCH /api/onboarding", err);
    return serverError("Failed to update onboarding state");
  }
}
