"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { List, Kanban, TrendingUp } from "lucide-react";

import { ViewSwitcher } from "@/components/common/ViewSwitcher";
import { OpportunityStats } from "./OpportunityStats";
import { OpportunityTable } from "./OpportunityTable";
import { OpportunityKanban } from "../kanban/OpportunityKanban";
import { OpportunityForecast } from "./OpportunityForecast";

const VIEWS = [
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "list", label: "List", icon: List },
  { id: "forecast", label: "Forecast", icon: TrendingUp },
];

/**
 * Opportunities module shell. Pipeline is now a view of the same record type —
 * /opportunities?view=kanban is the merged kanban board and
 * /opportunities?view=forecast is the weighted forecast.
 */
export function OpportunitiesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams?.get("view");
  // Kanban-first: /opportunities opens the board by default; list and forecast
  // are explicit opt-in views.
  const active = view === "list" || view === "forecast" ? view : "kanban";

  const handleChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("view", next);
      router.replace(`/opportunities?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      <ViewSwitcher
        tabs={VIEWS}
        active={active}
        onChange={handleChange}
        tourPrefix="view"
      />

      {active === "list" && (
        <>
          <OpportunityStats />
          <OpportunityTable />
        </>
      )}

      {active === "kanban" && <OpportunityKanban />}

      {active === "forecast" && <OpportunityForecast />}
    </div>
  );
}
