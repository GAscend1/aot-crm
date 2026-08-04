"use client";

import {
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  FileUp,
  Globe,
  Loader2,
  Mail,
  MonitorPlay,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Star,
  Target,
  UserRound,
  Video,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { OpportunityStageMenu } from "./OpportunityStageMenu";
import { OPPORTUNITY_STAGES, stageDotVar, type OpportunityStage } from "../stageConfig";

const moneyFmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

interface OverflowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

interface OpportunityWorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  stage: OpportunityStage;
  onStageSelect: (stage: OpportunityStage) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
  value?: number;
  probability?: number;
  phone?: string;
  website?: string;
  expectedCloseDate?: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onEdit: () => void;
  /** When true, the header pencil becomes a Cancel button for inline editing. */
  editing?: boolean;
  onCancelEdit?: () => void;
  onEmail: () => void;
  onTeams: () => void;
  onZoom: () => void;
  onQuote: () => void;
  onInvoice: () => void;
  onUpload: () => void;
  onActivity: () => void;
  onConvert: () => void;
  onAssign: () => void;
  onOpenFullPage: () => void;
  overflowActions: OverflowAction[];
  /** True while the Convert action is loading. */
  converting?: boolean;
}

const iconButtonClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

const chipClass =
  "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

/** Soft-tinted action chip used in the primary action bar. */
const actionChipClass = (color: string) =>
  cn(
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ring-1 ring-inset transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
    `bg-[color:var(${color})]/[0.1] text-[color:var(${color})] ring-[color:var(${color})]/25 hover:bg-[color:var(${color})]/[0.18]`
  );

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function OpportunityWorkspaceHeader({
  title,
  subtitle,
  stage,
  onStageSelect,
  favorite,
  onToggleFavorite,
  value,
  probability,
  phone,
  website,
  expectedCloseDate,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onClose,
  onEdit,
  editing = false,
  onCancelEdit,
  onEmail,
  onTeams,
  onZoom,
  onQuote,
  onInvoice,
  onUpload,
  onActivity,
  onConvert,
  onAssign,
  onOpenFullPage,
  overflowActions,
  converting = false,
}: OpportunityWorkspaceHeaderProps) {
  const revenue = value != null ? moneyFmt(value) : null;
  const stageIndex = OPPORTUNITY_STAGES.indexOf(stage) + 1;
  const totalStages = OPPORTUNITY_STAGES.length;
  const stageColor = stageDotVar[stage];

  const isClosed = stage === "Closed Won" || stage === "Closed Lost";
  const overdue =
    !isClosed && !!expectedCloseDate && new Date(expectedCloseDate).getTime() < startOfToday();

  return (
    <header className="bg-popover/95 backdrop-blur-sm supports-[backdrop-filter]:bg-popover/80">
      {/* Row 1 — identity, stage, value, communication + navigation */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleFavorite}
            className={cn(
              iconButtonClass,
              favorite && "text-[color:var(--warning)] hover:text-[color:var(--warning)]"
            )}
            aria-pressed={favorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn("h-4 w-4", favorite && "fill-[color:var(--warning)]")} />
          </button>

          <h2 className="min-w-0 truncate text-[17px] font-semibold tracking-tight text-foreground">
            {title}
          </h2>

          <button
            type="button"
            onClick={editing ? onCancelEdit : onEdit}
            className={iconButtonClass}
            aria-label={editing ? "Cancel editing" : "Edit opportunity"}
            title={editing ? "Cancel editing" : "Edit opportunity"}
          >
            {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>

          <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

          <OpportunityStageMenu stage={stage} onSelect={onStageSelect} className="shrink-0" />

          {revenue != null && (
            <span
              className="hidden shrink-0 items-center gap-1 rounded-full bg-[color:var(--chart-1)]/[0.12] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--chart-1)] ring-1 ring-inset ring-[color:var(--chart-1)]/25 md:inline-flex"
              title="Expected revenue"
            >
              <BadgeDollarSign className="h-3 w-3" aria-hidden="true" />
              {revenue}
            </span>
          )}
          {probability != null && (
            <span
              className="hidden shrink-0 items-center gap-1 rounded-full bg-[color:var(--chart-3)]/[0.12] px-2.5 py-0.5 text-xs font-medium text-[color:var(--chart-3)] ring-1 ring-inset ring-[color:var(--chart-3)]/25 lg:inline-flex"
              title="Probability"
            >
              <Target className="h-3 w-3" aria-hidden="true" />
              {probability}%
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <a
            href={phone ? `tel:${phone}` : undefined}
            aria-disabled={!phone}
            className={cn(iconButtonClass, !phone && "pointer-events-none opacity-40")}
            aria-label={phone ? `Call ${phone}` : "No phone number"}
            title="Call"
          >
            <Phone className="h-4 w-4" />
          </a>
          <button type="button" onClick={onEmail} className={iconButtonClass} aria-label="Email customer" title="Email">
            <Mail className="h-4 w-4" />
          </button>
          <button type="button" onClick={onTeams} className={iconButtonClass} aria-label="Start Teams meeting" title="Teams meeting">
            <Video className="h-4 w-4" />
          </button>
          <button type="button" onClick={onZoom} className={iconButtonClass} aria-label="Start Zoom meeting" title="Zoom meeting">
            <MonitorPlay className="h-4 w-4" />
          </button>
          <a
            href={
              website
                ? (website.startsWith("http") ? website : `https://${website}`)
                : undefined
            }
            target={website ? "_blank" : undefined}
            rel={website ? "noopener noreferrer" : undefined}
            aria-disabled={!website}
            className={cn(iconButtonClass, !website && "pointer-events-none opacity-40")}
            aria-label={website ? "Open company website" : "No company website"}
            title="Company website"
          >
            <Globe className="h-4 w-4" />
          </a>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onOpenFullPage}>
                <ExternalLink className="h-4 w-4" />
                Open Full Page
              </DropdownMenuItem>
              {overflowActions.length > 0 && <DropdownMenuSeparator />}
              {overflowActions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={action.onClick}
                  variant={action.destructive ? "destructive" : "default"}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canPrev}
              className={cn(iconButtonClass, "disabled:pointer-events-none disabled:opacity-40")}
              aria-label="Previous opportunity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              className={cn(iconButtonClass, "disabled:pointer-events-none disabled:opacity-40")}
              aria-label="Next opportunity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(iconButtonClass, "hover:bg-danger-soft hover:text-[color:var(--danger)]")}
            aria-label="Close opportunity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Row 2 — overdue, step, context, shortcuts */}
      <div className="flex items-center justify-between gap-2 px-3 pb-2 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {overdue && (
            <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-danger-soft px-2 text-[11px] font-semibold text-[color:var(--danger)] ring-1 ring-inset ring-danger/25">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--danger)]" aria-hidden="true" />
              Overdue
            </span>
          )}
          <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground">
            Step {stageIndex} of {totalStages}
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(${stageColor})` }} aria-hidden="true" />
          </span>
          {subtitle ? (
            <span className="min-w-0 truncate text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={onQuote} className={cn(chipClass, "text-[color:var(--chart-5)]")}>
            <Plus className="size-3" />
            New Quote
          </button>
          <button type="button" onClick={onInvoice} className={cn(chipClass, "text-[color:var(--success)]")}>
            <Plus className="size-3" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Thin stage-colored progress line */}
      <div
        className="h-[3px] w-full"
        role="presentation"
        aria-hidden="true"
        style={{
          background: `linear-gradient(to right, var(${stageColor}) ${(stageIndex / totalStages) * 100}%, transparent ${(stageIndex / totalStages) * 100}%)`,
        }}
      />

      {/* Primary action bar — directly below the header, not a card */}
      <OpportunityPrimaryActions
        onQuote={onQuote}
        onInvoice={onInvoice}
        onUpload={onUpload}
        onActivity={onActivity}
        onConvert={onConvert}
        onAssign={onAssign}
        converting={converting}
      />
    </header>
  );
}

/** Compact primary action bar placed directly below the workspace header. */
export function OpportunityPrimaryActions({
  onQuote,
  onInvoice,
  onUpload,
  onActivity,
  onConvert,
  onAssign,
  converting = false,
}: {
  onQuote: () => void;
  onInvoice: () => void;
  onUpload: () => void;
  onActivity: () => void;
  onConvert: () => void;
  onAssign: () => void;
  converting?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-border bg-muted/30 px-3 py-1.5 sm:px-4">
      <span className="mr-0.5 hidden text-[10px] font-semibold tracking-wider text-muted-foreground uppercase sm:inline">
        Actions
      </span>
      <button type="button" onClick={onQuote} className={actionChipClass("--chart-5")}>
        <FileText className="size-3.5" />
        Quote
      </button>
      <button type="button" onClick={onInvoice} className={actionChipClass("--success")}>
        <Receipt className="size-3.5" />
        Invoice
      </button>
      <button type="button" onClick={onUpload} className={actionChipClass("--chart-6")}>
        <FileUp className="size-3.5" />
        Upload
      </button>
      <button type="button" onClick={onActivity} className={actionChipClass("--info")}>
        <Plus className="size-3.5" />
        Activity
      </button>
      <button type="button" onClick={onConvert} disabled={converting} className={actionChipClass("--chart-2")}>
        {converting ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
        {converting ? "Converting…" : "Convert"}
      </button>
      <button type="button" onClick={onAssign} className={actionChipClass("--chart-4")}>
        <UserRound className="size-3.5" />
        Assign
      </button>
    </div>
  );
}
