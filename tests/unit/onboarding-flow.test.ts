import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) =>
  readFileSync(join(process.cwd(), ...p.split("/")), "utf8");

const HOOK = read("hooks/use-onboarding.ts");
const PROVIDERS = read("app/(app)/AppProviders.tsx");
const WIZARD = read("components/onboarding/OnboardingWizard.tsx");
const API = read("app/api/onboarding/route.ts");

/**
 * First-time user flow (LIVE bug fix): a genuinely new user (or a second user
 * from an existing tenant) signs in, gets an automatic Trial, and must land
 * IMMEDIATELY on the Welcome/Onboarding modal — never only a Dashboard
 * "Get Started" card. Onboarding state is the DB/server source of truth
 * (per-user), NOT localStorage.
 */
describe("first-time user onboarding auto-open (static)", () => {
  it("auto-opens the welcome modal for users with INCOMPLETE onboarding (started-but-not-finished included)", () => {
    // Regression: the old condition only showed the modal for users who had
    // never started (`!onboardingStartedAt`). A user who started the tour but
    // never completed it got stuck with no modal and no tour. The condition
    // must be based on completion/dismissal/opt-out only.
    expect(HOOK).toContain("!state.onboardingNeverShowAgain");
    expect(HOOK).toContain("!completed && !dismissed");
    expect(HOOK).not.toContain("!state.onboardingStartedAt");
  });

  it("uses the server/DB onboarding state as the source of truth (fetch on mount)", () => {
    expect(HOOK).toContain('fetch("/api/onboarding"');
    expect(API).toContain("onboardingCompletedAt");
    expect(API).toContain("onboardingStartedAt");
    expect(API).toContain("onboardingDismissedAt");
  });

  it("keeps per-user state (organization setup vs individual onboarding are distinct)", () => {
    // The API reads the signed-in user's own row — never organization-level.
    expect(API).toContain("prisma.user.update");
    expect(API).toContain("where: { id: user.id }");
  });

  it("auto-starts the Product Tour when the onboarding wizard completes", () => {
    // AppProviders listens for the wizard's completion event and starts the
    // tour — so the user flows into the tour instead of a bare dashboard.
    expect(PROVIDERS).toContain('"aot:onboarding-complete"');
    expect(PROVIDERS).toContain("startTour()");
  });

  it("the wizard dispatches the completion event after persisting state", () => {
    expect(WIZARD).toContain('"aot:onboarding-complete"');
    expect(WIZARD).toContain('"/api/onboarding"');
  });

  it("completed users do not get the welcome modal repeatedly", () => {
    expect(HOOK).toContain("const completed = !!state.onboardingCompletedAt;");
    expect(HOOK).toContain("!completed");
  });
});
