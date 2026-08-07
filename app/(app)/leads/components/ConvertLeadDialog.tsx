"use client";

import { useState } from "react";
import { X, Repeat } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";

interface ConvertLeadDialogProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadTitle: string;
  onConverted: (opportunityId?: string) => void;
}

const stageOptions = [
  "Discovery",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

export function ConvertLeadDialog({
  open,
  onClose,
  leadId,
  leadTitle,
  onConverted,
}: ConvertLeadDialogProps) {
  const { success, error: showError } = useToastContext();
  const [companyName, setCompanyName] = useState("");
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityTitle, setOpportunityTitle] = useState("");
  const [opportunityValue, setOpportunityValue] = useState("");
  const [opportunityStage, setOpportunityStage] = useState("Discovery");
  const [opportunityCloseDate, setOpportunityCloseDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConvert = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName || undefined,
          createOpportunity,
          opportunityTitle: opportunityTitle || undefined,
          opportunityValue: opportunityValue ? Number(opportunityValue) : undefined,
          opportunityStage,
          opportunityCloseDate: opportunityCloseDate || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to convert lead");
      }
      const body = (await res.json()) as { convertedOpportunityId?: string };
      success("Lead converted", `${leadTitle} was converted`);
      onConverted(body.convertedOpportunityId);
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to convert lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-md flex-col rounded-xl border bg-popover shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Repeat className="h-4 w-4 text-[color:var(--success)]" />
                Convert Lead
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{leadTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Creates a contact{createOpportunity ? ", company, and an opportunity in the pipeline" : " and company"} from this lead.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Company Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company name (optional)"
                  className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={createOpportunity}
                  onChange={(e) => setCreateOpportunity(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Create an opportunity
              </label>

              {createOpportunity && (
                <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Opportunity Title</label>
                    <input
                      value={opportunityTitle}
                      onChange={(e) => setOpportunityTitle(e.target.value)}
                      placeholder="Opportunity title (optional)"
                      className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Value ($)</label>
                      <input
                        type="number"
                        value={opportunityValue}
                        onChange={(e) => setOpportunityValue(e.target.value)}
                        placeholder="0"
                        className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Stage</label>
                      <select
                        value={opportunityStage}
                        onChange={(e) => setOpportunityStage(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {stageOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Expected Close</label>
                    <input
                      type="date"
                      value={opportunityCloseDate}
                      onChange={(e) => setOpportunityCloseDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleConvert} disabled={saving} className="bg-[color:var(--success)] text-[color:var(--success-foreground)] hover:opacity-90">
                {saving ? "Converting..." : "Convert"}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
