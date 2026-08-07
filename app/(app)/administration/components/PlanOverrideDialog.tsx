"use client";

import { useState } from "react";
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
import type { UIOrganization } from "@/app/api/platform/organizations/route";

const PLANS = ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
const SOURCES = ["TRIAL", "MANUAL", "SALES", "DEMO", "PARTNER", "BILLING", "INTERNAL"] as const;

interface PlanOverrideDialogProps {
  open: boolean;
  onClose: () => void;
  org: UIOrganization | null;
  onApplied: () => void;
}

/**
 * Platform Owner — manual plan control. No payment required: set an
 * organization to Trial / Starter / Professional / Enterprise with a source
 * and reason. Every change is persisted to the access audit trail.
 */
export function PlanOverrideDialog({ open, onClose, org, onApplied }: PlanOverrideDialogProps) {
  const { success, error } = useToastContext();
  const [planCode, setPlanCode] = useState<string>("PROFESSIONAL");
  const [source, setSource] = useState<string>("MANUAL");
  const [reason, setReason] = useState("");
  const [grantDays, setGrantDays] = useState("");
  const [saving, setSaving] = useState(false);

  // Re-seed defaults whenever a different org is selected.
  const [lastOrgId, setLastOrgId] = useState<string | null>(null);
  if (org && org.id !== lastOrgId) {
    setLastOrgId(org.id);
    setPlanCode(org.planCode === "TRIAL" ? "STARTER" : org.planCode);
    setReason("");
    setGrantDays("");
  }

  async function handleSave() {
    if (!org) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/platform/organizations/${org.id}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode,
          source,
          reason: reason.trim() || `${planCode} granted`,
          grantDays: grantDays ? Number(grantDays) : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed");
      }
      success(
        "Plan updated",
        `${org.name} is now on ${planCode} (${source}). Entitlements updated immediately.`,
      );
      onClose();
      onApplied();
    } catch (err) {
      error("Error", err instanceof Error ? err.message : "Failed to update plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={`Set plan — ${org?.name ?? ""}`}
      description="Manual plan control — no payment required. Recorded in the access audit trail."
      size="md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Plan</label>
          <div className="grid grid-cols-2 gap-2">
            {PLANS.map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => setPlanCode(plan)}
                aria-pressed={planCode === plan}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  planCode === plan
                    ? "border-[color:var(--primary)] bg-primary-soft text-[color:var(--primary)]"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {plan === "TRIAL" ? "Trial" : plan.charAt(0) + plan.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Source</label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Grant duration (days) — optional, e.g. trial extension
          </label>
          <Input
            type="number"
            min={1}
            placeholder="14"
            value={grantDays}
            onChange={(e) => setGrantDays(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Reason (recorded in audit trail)
          </label>
          <Input
            placeholder="Enterprise demo for Contoso, arranged by AOT sales"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Applying…" : "Apply plan"}
          </Button>
        </div>
      </div>
    </RecordModal>
  );
}
