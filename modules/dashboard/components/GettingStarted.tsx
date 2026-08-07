"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";

/**
 * Contextual onboarding checklist for the dashboard. Steps tick off as the
 * workspace fills up (companies, contacts/customers, opportunities, tour).
 * Dismisses itself once the workspace is meaningfully populated.
 */
export function GettingStarted() {
  const { kpis, recentCompanies, recentCustomers } = useDashboardData();

  const kpi = (title: string) => {
    const row = kpis.find((k) => k.title === title);
    return typeof row?.value === "string" ? parseInt(row.value.replace(/[^\d]/g, "") || "0", 10) : (row?.value as number) ?? 0;
  };

  // The dashboard KPI strip only surfaces sales KPIs now; onboarding progress
  // uses the actual recent lists instead of the removed Companies/Customers KPIs.
  const companies = recentCompanies.length;
  const customers = recentCustomers.length;
  const opportunities = kpi("Open Opportunities");

  const steps = [
    {
      label: "Choose your role",
      href: "/onboarding",
      done: false, // handled by wizard flow — always shown first until visited
      skip: false,
    },
    {
      label: "Add your first company",
      href: "/companies",
      done: companies > 0,
    },
    {
      label: "Add customers & contacts",
      href: "/contacts",
      done: customers > 0,
    },
    {
      label: "Create an opportunity",
      href: "/opportunities",
      done: opportunities > 0,
    },
    {
      label: "Take the guided tour",
      href: "/onboarding",
      done: false,
      tour: true,
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  // Once the core workflow is populated, the widget has served its purpose.
  if (companies > 0 && customers > 0 && opportunities > 0) return null;

  return (
    <SectionCard
      title={
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-[color:var(--primary)]" />
          Get Started
          <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
            {completed}/{steps.length}
          </span>
        </div>
      }
    >
      <ul className="space-y-1">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--success)]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
