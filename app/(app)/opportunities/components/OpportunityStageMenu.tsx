"use client";

import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  OPPORTUNITY_STAGES,
  getStageConfig,
  type OpportunityStage,
} from "../stageConfig";

interface OpportunityStageMenuProps {
  stage: OpportunityStage;
  onSelect: (stage: OpportunityStage) => void;
  disabled?: boolean;
  className?: string;
}

export function OpportunityStageMenu({
  stage,
  onSelect,
  disabled,
  className,
}: OpportunityStageMenuProps) {
  const current = getStageConfig(stage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
          current.pill,
          className
        )}
        aria-label={`Change stage, currently ${stage}`}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} aria-hidden="true" />
        {stage}
        <ChevronDown className="h-3 w-3 opacity-70" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <p className="px-2 pt-1 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Move to stage
        </p>
        {OPPORTUNITY_STAGES.map((option) => {
          const config = getStageConfig(option);
          const active = option === stage;
          return (
            <DropdownMenuItem
              key={option}
              onClick={() => onSelect(option)}
              disabled={active}
              className="gap-2"
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden="true" />
              <span className="flex-1">{option}</span>
              {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
