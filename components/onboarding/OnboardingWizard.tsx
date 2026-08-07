"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  Headset,
  Loader2,
  Shield,
  Sparkles,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Role options                                                        */
/* ------------------------------------------------------------------ */

const ROLE_OPTIONS = [
  {
    value: "SALES_MANAGER",
    label: "Sales Manager",
    description: "Oversee the team pipeline, forecasts, and win rates",
    icon: Briefcase,
  },
  {
    value: "SALES",
    label: "Sales Rep",
    description: "Manage your own leads, deals, and activities",
    icon: Target,
  },
  {
    value: "SUPPORT_MANAGER",
    label: "Support Manager",
    description: "Coordinate tickets, SLAs, and the support queue",
    icon: Headset,
  },
  {
    value: "SUPPORT",
    label: "Support Agent",
    description: "Resolve customer tickets and track follow-ups",
    icon: ClipboardList,
  },
  {
    value: "HR_MANAGER",
    label: "HR Manager",
    description: "Manage people records and team structure",
    icon: Users,
  },
  {
    value: "VIEWER",
    label: "Viewer",
    description: "Read-only access across the workspace",
    icon: Shield,
  },
] as const;

/* ------------------------------------------------------------------ */
/* Wizard steps                                                        */
/* ------------------------------------------------------------------ */

type Step = "role" | "sample" | "notifications" | "done";

interface OnboardingWizardProps {
  /** Pre-selected role from the server profile, if any. */
  initialRole?: string | null;
}

export function OnboardingWizard({ initialRole }: OnboardingWizardProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<string>(initialRole ?? "");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedResult, setSeedResult] = useState<string>("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [completing, setCompleting] = useState(false);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };

  const saveRole = useCallback(async () => {
    if (!role) return false;
    setSavingRole(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setSavingRole(false);
    }
  }, [role]);

  const loadSampleData = useCallback(async () => {
    setSeeding(true);
    setSeedResult("");
    try {
      const res = await fetch("/api/onboarding/sample-data", {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        counts?: { companies: number; customers: number; opportunities: number };
      };
      if (!res.ok) throw new Error(body.error || "Failed to load sample data");
      setSeeded(true);
      const c = body.counts;
      setSeedResult(
        c
          ? `Created ${c.companies} companies, ${c.customers} customers, and ${c.opportunities} opportunities.`
          : "Sample data loaded."
      );
    } catch (err) {
      setSeedResult(err instanceof Error ? err.message : "Failed to load sample data");
    } finally {
      setSeeding(false);
    }
  }, []);

  const finish = useCallback(async () => {
    setCompleting(true);
    try {
      // Persist notification preference (default on).
      localStorage.setItem("aot-notifications-enabled", notificationsEnabled ? "true" : "false");
      window.dispatchEvent(new CustomEvent("aot:notifications-pref-change"));
      // Mark onboarding complete so the welcome modal never reappears.
      // Best-effort: a network failure still finishes the local flow.
      try {
        await fetch("/api/onboarding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingStartedAt: new Date().toISOString(),
            onboardingCompletedAt: new Date().toISOString(),
          }),
        });
      } catch {
        /* offline — local state still marks onboarding done */
      }
      window.dispatchEvent(new CustomEvent("aot:onboarding-complete"));
      router.push("/dashboard");
    } finally {
      setCompleting(false);
    }
  }, [notificationsEnabled, router]);

  const goNext = useCallback(async () => {
    if (step === "role") {
      if (role) {
        const saved = await saveRole();
        if (!saved) {
          setRoleError("Could not save your role right now. Check your connection and try again.");
          return; // stay on the role step so the selection isn't silently lost
        }
      }
      setRoleError(null);
      setStep("sample");
    } else if (step === "sample") {
      setStep("notifications");
    } else if (step === "notifications") {
      setStep("done");
    } else if (step === "done") {
      void finish();
    }
  }, [step, role, saveRole, finish]);

  const canContinue =
    step === "role" ? !!role : step === "sample" ? true : step === "notifications" ? true : step === "done" ? true : false;

  /* ------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-1.5">
        {(["role", "sample", "notifications"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              ["role", "sample", "notifications"].indexOf(step) >= i
                ? "bg-[color:var(--primary)]"
                : "bg-muted"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={transition}
        >
          {step === "role" && (
            <div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)] text-primary-foreground">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">How will you use AOT CRM?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick the role that best matches your day-to-day work. You can change this later
                    in your profile.
                  </p>
                </div>
              </div>

              {roleError && (
                <p className="mt-4 rounded-lg border border-danger-soft bg-danger-soft/40 px-3 py-2 text-xs text-[color:var(--danger)]">
                  {roleError}
                </p>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        active
                          ? "border-[color:var(--primary)] bg-primary-soft/50 ring-1 ring-[color:var(--primary)]/30"
                          : "border-border bg-surface-raised hover:border-primary/40 hover:bg-muted/40"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          active ? "bg-primary-soft text-[color:var(--primary)]" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                      <span
                        className={cn(
                          "ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                          active ? "border-[color:var(--primary)] bg-[color:var(--primary)]" : "border-muted-foreground/40"
                        )}
                        aria-hidden="true"
                      >
                        {active && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "sample" && (
            <div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)] text-primary-foreground">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Start with sample data?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Load a small, realistic dataset so you can explore the dashboard, pipeline, and
                    record views before entering your own data. Only available for an empty
                    workspace.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => void loadSampleData()}
                  disabled={seeding || seeded}
                  className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-[color:var(--primary)]">
                    {seeding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : seeded ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {seeded ? "Sample data loaded" : "Load sample data"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Companies, contacts, opportunities, and a few activities
                    </p>
                  </div>
                </button>

                {seedResult && (
                  <p
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs",
                      seedResult.startsWith("Created") || seedResult.startsWith("Sample data")
                        ? "border-success-soft bg-success-soft/40 text-[color:var(--success)]"
                        : "border-danger-soft bg-danger-soft/40 text-[color:var(--danger)]"
                    )}
                  >
                    {seedResult}
                  </p>
                )}

                <p className="text-xs text-muted-foreground/70">
                  Prefer to start clean? Just continue — every record view works the same with an
                  empty workspace.
                </p>
              </div>
            </div>
          )}

          {step === "notifications" && (
            <div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)] text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Stay in the loop</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get notified about assignments, follow-ups, and important events. You can change
                    this anytime.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={() => setNotificationsEnabled((v) => !v)}
                className="mt-6 flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised p-4 text-left transition-all hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">In-app notifications</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Reminders for meetings, tasks, and activity assignments
                  </p>
                </div>
                <span
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
                    notificationsEnabled ? "bg-[color:var(--primary)]" : "bg-muted-foreground/30"
                  )}
                  aria-hidden="true"
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                      notificationsEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                    )}
                  />
                </span>
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-[color:var(--success)]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">You&apos;re all set!</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Your workspace is ready. Take the guided tour to learn the core workflow, or jump
                straight into the dashboard.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer actions */}
      <div className="mt-8 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step === "role" ? router.push("/dashboard") : setStep(step === "sample" ? "role" : step === "notifications" ? "sample" : "notifications"))}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {step === "role" ? "Skip for now" : "Back"}
        </Button>

        <Button
          size="sm"
          onClick={() => void goNext()}
          disabled={!canContinue || completing || savingRole}
        >
          {step === "role" && (savingRole ? "Saving..." : "Continue")}
          {step === "sample" && "Continue"}
          {step === "notifications" && "Finish setup"}
          {step === "done" && (completing ? "Finishing..." : "Go to dashboard")}
          {step !== "role" && step !== "done" && !completing && (
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
