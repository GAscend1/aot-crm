"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Compass,
  Sparkles,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Tour steps                                                          */
/* ------------------------------------------------------------------ */

interface TourStep {
  id: string;
  /** CSS selector for the element to spotlight. Falls back to centered tooltip. */
  target?: string;
  title: string;
  description: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    target: '[data-tour="nav-/dashboard"]',
    title: "Dashboard",
    description:
      "Get a real-time snapshot of your pipeline value, open opportunities, new leads, and upcoming activity.",
  },
  {
    id: "companies",
    target: '[data-tour="nav-/companies"]',
    title: "Companies",
    description:
      "Companies are your organizational records. Track lifecycle stage, industry, owner, people, and opportunities in one workspace.",
  },
  {
    id: "people",
    target: '[data-tour="nav-/contacts"]',
    title: "People",
    description:
      "People are your individual contacts. Each person belongs to a company (or stands alone) and links to opportunities, activities, and tickets.",
  },
  {
    id: "leads",
    target: '[data-tour="nav-/leads"]',
    title: "Leads",
    description:
      "Capture unqualified prospects, then convert them into opportunities when they are ready to move through the pipeline.",
  },
  {
    id: "opportunities",
    target: '[data-tour="nav-/opportunities"]',
    title: "Opportunities",
    description:
      "Track active potential sales with value, probability, owner, priority, and expected close date. Switch between List, Kanban, and Forecast views.",
  },
  {
    id: "activities",
    target: '[data-tour="nav-/activities"]',
    title: "Activities",
    description:
      "Log calls, emails, meetings, tasks, notes, and comments against any record to build a complete communication history.",
  },
  {
    id: "quotes",
    target: '[data-tour="nav-/quotes"]',
    title: "Quotes & Invoices",
    description:
      "Create professional quotes and invoices with line items, and convert accepted quotes straight into invoices.",
  },
  {
    id: "search",
    target: '[data-tour="global-search"]',
    title: "Global Search",
    description:
      "Press Ctrl+K (or Command+K on Mac) to search across companies, people, leads, opportunities, and documents.",
  },
  {
    id: "notifications",
    target: '[data-tour="notifications"]',
    title: "Notifications",
    description:
      "Stay on top of assignments, follow-ups, and events. Click the bell to review and manage your notifications.",
  },
];

/* ------------------------------------------------------------------ */
/* Spotlight + tooltip overlay                                         */
/* ------------------------------------------------------------------ */

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function computeRect(el: Element | null, reduceMotion: boolean): SpotlightRect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  if (!reduceMotion) {
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function TourOverlay({
  step,
  index,
  total,
  onBack,
  onNext,
  onSkip,
  onFinish,
}: {
  step: TourStep;
  index: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    const el = step.target ? document.querySelector(step.target) : null;
    // Defer first measurement so the element settles after any scroll.
    const frame = window.requestAnimationFrame(() => {
      setRect(computeRect(el, !!reduceMotion));
    });
    const timer = window.setTimeout(() => {
      setRect(computeRect(el, !!reduceMotion));
    }, 300);
    const onResize = () => setRect(computeRect(el, !!reduceMotion));
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [step, reduceMotion]);

  const isLast = index === total - 1;
  const centered = !rect;

  /* Tooltip placement — anchored below the target when available, else centered. */
  const tooltipStyle: React.CSSProperties = centered
    ? {}
    : {
        position: "fixed",
        top: Math.min(rect.top + rect.height + 16, window.innerHeight - 240),
        left: Math.max(12, Math.min(rect.left + rect.width / 2 - 180, window.innerWidth - 372)),
        width: 360,
        maxWidth: "calc(100vw - 24px)",
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tour step ${index + 1}: ${step.title}`}
      className="fixed inset-0 z-[80]"
    >
      {/* Spotlight hole */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-[color:var(--primary)] transition-all duration-200"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.55)",
          }}
        />
      )}

      {/* Dimmed background when no target found */}
      {!rect && <div className="absolute inset-0 bg-slate-950/50" />}

      {/* Tooltip / welcome card */}
      {createPortal(
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "rounded-xl border border-border bg-popover p-5 shadow-2xl",
              centered &&
                "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
            style={tooltipStyle}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-[color:var(--primary)]">
                <Compass className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={onSkip}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Skip tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-3 text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>

            <div className="mt-4 flex items-center gap-1">
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i === index
                      ? "bg-[color:var(--primary)]"
                      : "bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {index + 1} of {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
                <Button variant="outline" size="sm" onClick={onBack} disabled={index === 0}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back
                </Button>
                {isLast ? (
                  <Button size="sm" onClick={onFinish}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Finish
                  </Button>
                ) : (
                  <Button size="sm" onClick={onNext}>
                    Next
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>,
          document.body
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Welcome modal                                                       */
/* ------------------------------------------------------------------ */

function WelcomeModal({
  onStart,
  onSkip,
  onNeverShowAgain,
}: {
  onStart: () => void;
  onSkip: () => void;
  onNeverShowAgain: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to AOT CRM"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-border bg-popover p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)] text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Welcome to AOT CRM
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Learn the core workflow in about two minutes. We will show you the
              most important parts of the product so you can get started fast.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {[
            "Track companies, people, and deals in one place",
            "Manage your sales pipeline with drag-and-drop",
            "Log activities, create quotes, and send invoices",
          ].map((point) => (
            <div key={point} className="flex items-center gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--success)]" />
              {point}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onNeverShowAgain}
            className="text-left text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Do not show again
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onSkip}>
              Skip for Now
            </Button>
            <Button onClick={onStart}>
              Start Tour
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main controller — fully controlled by the parent hook               */
/* ------------------------------------------------------------------ */

export interface ProductTourProps {
  open: boolean;
  /** "welcome" shows the intro modal; "tour" runs the guided steps. */
  mode: "welcome" | "tour";
  stepIndex?: number;
  onStart: () => void;
  onSkip: () => void;
  onNeverShowAgain: () => void;
  onStepChange: (index: number) => void;
  onComplete: () => void;
}

export function ProductTour({
  open,
  mode,
  stepIndex = 0,
  onStart,
  onSkip,
  onNeverShowAgain,
  onStepChange,
  onComplete,
}: ProductTourProps) {
  const currentStep = Math.min(stepIndex, TOUR_STEPS.length - 1);

  const goBack = () => {
    if (currentStep > 0) onStepChange(currentStep - 1);
  };

  const goNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      onComplete();
    }
  };

  // Keyboard support: Escape skips, Arrow keys navigate.
  useEffect(() => {
    if (!open || mode !== "tour") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentStep < TOUR_STEPS.length - 1) onStepChange(currentStep + 1);
        else onComplete();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentStep > 0) onStepChange(currentStep - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, mode, currentStep, onSkip, onStepChange, onComplete]);

  if (!open) return null;

  return mode === "welcome" ? (
    <WelcomeModal
      onStart={onStart}
      onSkip={onSkip}
      onNeverShowAgain={onNeverShowAgain}
    />
  ) : (
    <TourOverlay
      key={`tour-${currentStep}`}
      step={TOUR_STEPS[currentStep]}
      index={currentStep}
      total={TOUR_STEPS.length}
      onBack={goBack}
      onNext={goNext}
      onSkip={onSkip}
      onFinish={onComplete}
    />
  );
}
