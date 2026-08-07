"use client";

import { useState } from "react";
import { Trophy, XCircle, Gauge } from "lucide-react";
import { RecordModal } from "@/components/common/RecordModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastContext } from "@/app/(app)/AppProviders";
import { opportunityService } from "@/services/index";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/services/opportunity.service";

export const WIN_REASONS = [
  "Negotiated successfully",
  "Customer reference",
  "Product fit",
  "Competitive win",
  "Renewal / expansion",
  "Executive relationship",
  "Other",
];

export const LOST_REASONS = [
  "Price",
  "Competitor",
  "Budget",
  "Timeline",
  "Product fit",
  "No decision",
  "Champion left",
  "Other",
];

interface DealQuickUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  /** Preselect the outcome (e.g. opened from "Mark as lost"). */
  presetOutcome?: "won" | "lost";
  onSaved?: () => void;
}

export function DealQuickUpdateDialog({
  open,
  onClose,
  opportunity,
  presetOutcome,
  onSaved,
}: DealQuickUpdateDialogProps) {
  const { success, error: showError } = useToastContext();
  // State is seeded from the opportunity via lazy initializers. Callers remount
  // the dialog with a `key` when the record changes so the draft always matches
  // the record being edited.
  const [outcome, setOutcome] = useState<"open" | "won" | "lost">(() =>
    opportunity?.status === "Won"
      ? "won"
      : opportunity?.status === "Lost"
        ? "lost"
        : presetOutcome ?? "open",
  );
  const [probability, setProbability] = useState<string>(() =>
    String(opportunity?.probability ?? 0),
  );
  const [closeDate, setCloseDate] = useState<string>(() =>
    opportunity?.expectedCloseDate?.slice(0, 10) ?? "",
  );
  const [reason, setReason] = useState<string>(() =>
    opportunity?.wonReason || opportunity?.lostReason || "",
  );
  const [submitting, setSubmitting] = useState(false);

  const isClosed = outcome !== "open";

  const handleSave = async () => {
    if (!opportunity) return;
    if (isClosed && !reason.trim()) {
      showError("Reason required", "Add a win/loss reason before closing the deal.");
      return;
    }
    setSubmitting(true);
    try {
      const patch: Partial<Opportunity> = {
        probability: Math.min(100, Math.max(0, Number(probability) || 0)),
      };
      if (closeDate) patch.expectedCloseDate = new Date(closeDate).toISOString();

      if (outcome === "won") {
        patch.stage = "Closed Won";
        patch.status = "Won";
        patch.probability = 100;
        patch.wonReason = reason.trim();
        patch.lostReason = "";
        patch.closedAt = new Date().toISOString();
      } else if (outcome === "lost") {
        patch.stage = "Closed Lost";
        patch.status = "Lost";
        patch.probability = 0;
        patch.lostReason = reason.trim();
        patch.wonReason = "";
        patch.closedAt = new Date().toISOString();
      }

      await opportunityService.update(opportunity.id, patch);
      success(outcome === "won" ? "Deal won" : outcome === "lost" ? "Deal lost" : "Deal updated");
      onSaved?.();
      onClose();
    } catch (err) {
      showError("Update failed", err instanceof Error ? err.message : "Could not update the deal.");
    } finally {
      setSubmitting(false);
    }
  };

  const reasonOptions = outcome === "won" ? WIN_REASONS : LOST_REASONS;

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title="Quick update deal"
      description={opportunity ? opportunity.title : ""}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {/* Outcome */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Outcome</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOutcome("open")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                outcome === "open"
                  ? "border-[color:var(--info)] bg-info-soft text-[color:var(--info)]"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <Gauge className="h-3.5 w-3.5" />
              Open
            </button>
            <button
              type="button"
              onClick={() => { setOutcome("won"); setReason(""); }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                outcome === "won"
                  ? "border-[color:var(--success)] bg-success-soft text-[color:var(--success)]"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <Trophy className="h-3.5 w-3.5" />
              Won
            </button>
            <button
              type="button"
              onClick={() => { setOutcome("lost"); setReason(""); }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                outcome === "lost"
                  ? "border-[color:var(--danger)] bg-danger-soft text-[color:var(--danger)]"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <XCircle className="h-3.5 w-3.5" />
              Lost
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Probability</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              disabled={isClosed}
              placeholder="0-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Expected close</label>
            <Input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
          </div>
        </div>

        {isClosed && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {outcome === "won" ? "Win reason" : "Loss reason"}
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder={`Select a ${outcome === "won" ? "win" : "loss"} reason`} />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </RecordModal>
  );
}
