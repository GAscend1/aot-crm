"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Receipt, Plus, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToastContext } from "@/app/(app)/AppProviders";
import type { Opportunity } from "@/services/opportunity.service";

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  quote?: {
    id: string;
    quoteNumber: string;
    items: { name: string; description: string; quantity: number; unitPrice: number }[];
  } | null;
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

export function CreateInvoiceModal({ open, onClose, opportunity, quote, onCreated }: CreateInvoiceModalProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<DraftItem[]>(() =>
    quote?.items.length
      ? quote.items.map((i) => ({
          key: crypto.randomUUID(),
          name: i.name,
          description: i.description,
          quantity: String(i.quantity),
          unitPrice: String(i.unitPrice),
        }))
      : [{ key: crypto.randomUUID(), name: "", description: "Product or service", quantity: "1", unitPrice: "" }]
  );
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

  const createInvoice = async (): Promise<{ id: string; invoiceNumber: string }> => {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: quote?.id ?? null,
        customerId: opportunity.customerId || null,
        companyId: opportunity.companyId || null,
        opportunityId: opportunity.id,
        leadId: opportunity.leadId || null,
        currency,
        dueDate: dueDate || null,
        notes,
        taxRate: Number(taxRate) || 0,
        discount: Number(discount) || 0,
        items: parsedItems,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to create invoice");
    }
    return (await res.json()) as { id: string; invoiceNumber: string };
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const created = await createInvoice();
      success("Invoice created", `${created.invoiceNumber} has been saved as a draft.`);
      onCreated?.();
      onClose();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Could not create invoice.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndOpen = async () => {
    setSaving(true);
    try {
      const created = await createInvoice();
      success("Invoice created", `${created.invoiceNumber} is ready.`);
      router.push(`/invoices/${created.id}`);
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Could not create invoice.");
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border bg-surface-raised shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Receipt className="h-4 w-4 text-[color:var(--success)]" />
                {quote ? `Create Invoice from ${quote.quoteNumber}` : "Create Invoice"}
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Opportunity</p>
                  <p className="font-medium text-foreground">{opportunity.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{opportunity.customer || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Company</p>
                  <p className="font-medium text-foreground">{opportunity.company || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</p>
                  <p className="font-medium text-foreground">{opportunity.contact || "—"}</p>
                </div>
                {quote && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Source Quote</p>
                    <p className="font-medium text-foreground">
                      {quote.quoteNumber} — line items copied for invoicing
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Currency</label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
                  <div className="grid grid-cols-[1.3fr_1.5fr_0.6fr_0.8fr_0.8fr_auto] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
                      <div className="text-right text-sm font-medium text-foreground">
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
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, notes..." />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{currencyFmt(subtotal)}</span>
                </div>
                <div className="mt-1 flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-{currencyFmt(Number(discount) || 0)}</span>
                </div>
                <div className="mt-1 flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{currencyFmt(tax)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold text-foreground">
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
              <Button className="bg-success text-success-foreground hover:bg-success/80" onClick={() => void handleSaveAndOpen()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save & Open Invoice
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
