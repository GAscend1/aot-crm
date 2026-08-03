"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KanbanBoard } from "@/components/enterprise/KanbanBoard";
import { opportunityService } from "@/services/index";
import type { Opportunity } from "@/services/opportunity.service";
import { useToastContext } from "@/app/(app)/AppProviders";
import { OpportunityWorkspace } from "../components/OpportunityWorkspace";
import { OPPORTUNITY_STAGES, stageDotVar } from "../stageConfig";

export function OpportunityKanban() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    opportunityService.findAll().then((result) => {
      setOpportunities(result.data);
      setLoading(false);
    });
  }, []);

  const columns = OPPORTUNITY_STAGES.map((stage) => ({
    id: stage,
    title: stage,
    color: stageDotVar[stage],
    cards: opportunities
      .filter((opp) => opp.stage === stage)
      .map((opp) => ({
        id: opp.id,
        title: opp.title,
        subtitle: opp.customer,
        company: opp.company,
        priority: opp.priority,
        expectedClose: opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : undefined,
        value: opp.value,
        probability: opp.probability,
        assignee: opp.owner,
        tags: [],
      })),
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
    <div className="h-[calc(100vh-12rem)]">
      <KanbanBoard
        columns={columns}
        onCardMove={handleCardMove}
        onCardClick={(id) => {
          router.push(`/opportunities/kanban?record=${encodeURIComponent(id)}`, {
            scroll: false,
          });
        }}
      />
      <OpportunityWorkspace
        key={searchParams?.get("record") ? `record:${searchParams.get("record")}` : "closed"}
        siblings={opportunities.map((o) => ({ id: o.id, title: o.title }))}
        onChanged={() => {
          opportunityService.findAll().then((result) => {
            setOpportunities(result.data);
          });
        }}
      />
    </div>
  );
}
