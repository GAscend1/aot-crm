"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { FileText, Plus, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToastContext } from "@/app/(app)/AppProviders";
import type { Opportunity } from "@/services/opportunity.service";

interface CreateQuoteModalProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  onCreated?: () => void;
}

interface DraftItem {
  key: string;
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

const currencyFmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function CreateQuoteModal({ open, onClose, opportunity, onCreated }: CreateQuoteModalProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<DraftItem[]>([
    { key: crypto.randomUUID(), name: "", description: "Product or service", quantity: "1", unitPrice: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const addItem = () =>
    setItems((prev) => [...prev, { key: crypto.randomUUID(), name: "", description: "Product or service", quantity: "1", unitPrice: "" }]);

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const updateItem = (key: string, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const parsedItems = items
    .filter((i) => i.name.trim() || i.description.trim())
    .map((i) => ({
      name: i.name.trim(),
      description: i.description.trim() || "Item",
      quantity: Number(i.quantity) || 0,
      unitPrice: Number(i.unitPrice) || 0,
    }));

  const subtotal = parsedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal - (Number(discount) || 0) + tax;

  const createQuote = async (): Promise<{ id: string; quoteNumber: string }> => {
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: opportunity.customerId || null,
        companyId: opportunity.companyId || null,
        opportunityId: opportunity.id,
        leadId: opportunity.leadId || null,
        currency,
        validUntil: validUntil || null,
        notes,
        taxRate: Number(taxRate) || 0,
        discount: Number(discount) || 0,
        items: parsedItems,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to create quote");
    }
    return (await res.json()) as { id: string; quoteNumber: string };
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const created = await createQuote();
      success("Quote created", `${created.quoteNumber} has been saved as a draft.`);
      onCreated?.();
      onClose();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Could not create quote.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndOpen = async () => {
    setSaving(true);
    try {
      const created = await createQuote();
      success("Quote created", `${created.quoteNumber} is ready.`);
      router.push(`/quotes/${created.id}`);
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Could not create quote.");
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <FileText className="h-4 w-4 text-blue-500" />
                Create Quote
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-5">
              {/* Prefilled context */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Opportunity</p>
                  <p className="font-medium text-slate-900 dark:text-white">{opportunity.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Customer</p>
                  <p className="font-medium text-slate-900 dark:text-white">{opportunity.customer || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Company</p>
                  <p className="font-medium text-slate-900 dark:text-white">{opportunity.company || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Contact</p>
                  <p className="font-medium text-slate-900 dark:text-white">{opportunity.contact || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Lead</p>
                  <p className="font-medium text-slate-900 dark:text-white">{opportunity.leadName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Owner</p>
                  <p className="font-medium text-slate-900 dark:text-white">{opportunity.owner || "Unassigned"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Currency</label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Valid Until</label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Discount ($)</label>
                  <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Line Items</label>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1.3fr_1.5fr_0.6fr_0.8fr_0.8fr_auto] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    <span>Product</span>
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span className="text-right">Amount</span>
                    <span />
                  </div>
                  {items.map((item) => (
                    <div key={item.key} className="grid grid-cols-[1.3fr_1.5fr_0.6fr_0.8fr_0.8fr_auto] items-center gap-2">
                      <Input placeholder="Product / service" value={item.name} onChange={(e) => updateItem(item.key, { name: e.target.value })} />
                      <Input value={item.description} onChange={(e) => updateItem(item.key, { description: e.target.value })} />
                      <Input type="number" min={0} value={item.quantity} onChange={(e) => updateItem(item.key, { quantity: e.target.value })} />
                      <Input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })} />
                      <div className="text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                        {currencyFmt((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.key)} aria-label="Remove item">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Tax Rate (%)</label>
                  <Input type="number" min={0} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms, notes..." />
                </div>
              </div>

              <div className="rounded-lg border bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{currencyFmt(subtotal)}</span>
                </div>
                <div className="mt-1 flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span>-{currencyFmt(Number(discount) || 0)}</span>
                </div>
                <div className="mt-1 flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>{currencyFmt(tax)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold text-slate-900 dark:text-white">
                  <span>Grand Total</span>
                  <span>{currencyFmt(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-5 py-3 dark:border-slate-800">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => void handleSaveDraft()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Draft
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => void handleSaveAndOpen()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save & Open Quote
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
