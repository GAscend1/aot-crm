"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gauge, MoreHorizontal, Trophy, XCircle } from "lucide-react";
import { KanbanBoard } from "@/components/enterprise/KanbanBoard";
import { opportunityService } from "@/services/index";
import type { Opportunity } from "@/services/opportunity.service";
import { useToastContext } from "@/app/(app)/AppProviders";
import { OpportunityWorkspace } from "../components/OpportunityWorkspace";
import { OPPORTUNITY_STAGES, stageDotVar } from "../stageConfig";
import { PipelineFiltersBar } from "../components/PipelineFiltersBar";
import { DealQuickUpdateDialog } from "../components/DealQuickUpdateDialog";
import { computeDealHealth, dealHealthToneClass } from "@/lib/deal-health";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PipelineFilters {
  search: string;
  owner: string;
  priority: string;
  minValue: string;
  maxValue: string;
}

const DEFAULT_FILTERS: PipelineFilters = {
  search: "",
  owner: "all",
  priority: "all",
  minValue: "",
  maxValue: "",
};

function matchesFilters(opp: Opportunity, filters: PipelineFilters): boolean {
  const s = filters.search.toLowerCase();
  if (s) {
    const searchable = [opp.title, opp.customer, opp.company, opp.contact, opp.owner, opp.stage]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!searchable.includes(s)) return false;
  }

  if (filters.owner !== "all" && opp.owner !== filters.owner) return false;

  if (filters.priority !== "all") {
    const oppPriority = (opp.priority ?? "Medium").toLowerCase();
    const filterPriority = filters.priority.toLowerCase();
    if (oppPriority !== filterPriority) return false;
  }

  const minVal = filters.minValue ? Number(filters.minValue) : 0;
  const maxVal = filters.maxValue ? Number(filters.maxValue) : Infinity;
  const oppVal = opp.value ?? 0;
  if (oppVal < minVal || oppVal > maxVal) return false;

  return true;
}

interface QuickUpdateState {
  id: string;
  outcome?: "won" | "lost";
}

export function OpportunityKanban() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PipelineFilters>(DEFAULT_FILTERS);
  const [quickUpdate, setQuickUpdate] = useState<QuickUpdateState | null>(null);
  const { success, error: showError } = useToastContext();

  const reload = useCallback(() => {
    opportunityService.findAll().then((result) => {
      setOpportunities(result.data);
    });
  }, []);

  const quickUpdateOpportunity = useMemo(
    () => opportunities.find((o) => o.id === quickUpdate?.id) ?? null,
    [opportunities, quickUpdate]
  );

  useEffect(() => {
    opportunityService.findAll().then((result) => {
      setOpportunities(result.data);
      setLoading(false);
    });
  }, []);

  const filteredOpportunities = useMemo(
    () => opportunities.filter((opp) => matchesFilters(opp, filters)),
    [opportunities, filters]
  );

  const owners = useMemo(
    () =>
      Array.from(new Set(opportunities.map((o) => o.owner).filter(Boolean))).sort() as string[],
    [opportunities]
  );

  const columns = OPPORTUNITY_STAGES.map((stage) => ({
    id: stage,
    title: stage,
    color: stageDotVar[stage],
    cards: filteredOpportunities
      .filter((opp) => opp.stage === stage)
      .map((opp) => {
        const health = computeDealHealth(opp);
        return {
          id: opp.id,
          title: opp.title,
          subtitle: opp.customer,
          company: opp.company,
          priority: opp.priority,
          expectedClose: opp.expectedCloseDate
            ? new Date(opp.expectedCloseDate).toLocaleDateString()
            : undefined,
          value: opp.value,
          probability: opp.probability,
          assignee: opp.owner,
          tags: opp.leadSource ? [opp.leadSource] : [],
          health: { label: health.label, tone: dealHealthToneClass(health.tone) },
          /** Activity indicator — true if there was recent activity */
          hasActivity: false, // Could be enhanced with real activity data
        };
      }),
  }));

  const handleCardMove = useCallback(
    async (cardId: string, _fromColumn: string, toColumn: string) => {
      const previous = opportunities;
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === cardId
            ? { ...opp, stage: toColumn as Opportunity["stage"] }
            : opp
        )
      );
      try {
        await opportunityService.update(cardId, {
          stage: toColumn as Opportunity["stage"],
        });
        success("Opportunity updated", `Moved to ${toColumn}`);
      } catch {
        setOpportunities(previous);
        showError("Update failed", "Could not move opportunity. Reverting.");
      }
    },
    [opportunities, success, showError]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <PipelineFiltersBar
        filters={filters}
        onChange={setFilters}
        owners={owners}
      />
      <div className="h-[calc(100vh-16rem)]">
        <KanbanBoard
          columns={columns}
          onCardMove={handleCardMove}
          onCardClick={(id) => {
            router.push(
              `/opportunities?view=kanban&record=${encodeURIComponent(id)}`,
              { scroll: false }
            );
          }}
          renderCardMenu={(card) => (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-popover text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Actions for ${card.title}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-44">
                <DropdownMenuItem onClick={() => setQuickUpdate({ id: card.id })}>
                  <Gauge className="mr-2 h-4 w-4" />
                  Quick update
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setQuickUpdate({ id: card.id, outcome: "won" })}>
                  <Trophy className="mr-2 h-4 w-4 text-[color:var(--success)]" />
                  Mark as won
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setQuickUpdate({ id: card.id, outcome: "lost" })}>
                  <XCircle className="mr-2 h-4 w-4 text-[color:var(--danger)]" />
                  Mark as lost
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
        <DealQuickUpdateDialog
          key={`${quickUpdateOpportunity?.id ?? "closed"}:${quickUpdate?.outcome ?? "open"}`}
          open={!!quickUpdate}
          onClose={() => setQuickUpdate(null)}
          opportunity={quickUpdateOpportunity}
          presetOutcome={quickUpdate?.outcome}
          onSaved={reload}
        />
        <OpportunityWorkspace
          key={searchParams?.get("record") ? `record:${searchParams.get("record")}` : "closed"}
          siblings={opportunities.map((o) => ({ id: o.id, title: o.title }))}
          onChanged={reload}
        />
      </div>
    </div>
  );
}
