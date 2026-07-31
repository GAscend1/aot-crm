"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Invoice, InvoiceLineItem } from "../types";

export interface InvoicePrefill {
  customer?: string;
  company?: string;
  opportunity?: string;
  customerId?: string;
  companyId?: string;
  opportunityId?: string;
}

interface InvoiceFormProps {
  initialData?: Invoice;
  prefill?: InvoicePrefill;
  onSubmit: (data: Invoice) => void;
  onCancel: () => void;
}

interface DraftItem {
  key: string;
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export function InvoiceForm({ initialData, prefill, onSubmit, onCancel }: InvoiceFormProps) {
  const [customer, setCustomer] = useState(initialData?.customer ?? prefill?.customer ?? "");
  const [company, setCompany] = useState(initialData?.company ?? prefill?.company ?? "");
  const [opportunity, setOpportunity] = useState(initialData?.opportunity ?? prefill?.opportunity ?? "");
  const [currency, setCurrency] = useState(initialData?.currency ?? "USD");
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "");
  const [discount, setDiscount] = useState(initialData?.discount?.toString() ?? "");
  const [taxRate, setTaxRate] = useState(
    initialData && initialData.subtotal > 0 ? ((initialData.tax / initialData.subtotal) * 100).toFixed(2) : ""
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [items, setItems] = useState<DraftItem[]>(
    initialData?.items?.map((i) => ({
      key: i.id,
      name: i.name,
      description: i.description,
      quantity: String(i.quantity),
      unitPrice: String(i.unitPrice),
    })) ?? [{ key: crypto.randomUUID(), name: "", description: "Product or service", quantity: "1", unitPrice: "" }]
  );

  const addItem = () => setItems((prev) => [...prev, { key: crypto.randomUUID(), name: "", description: "Product or service", quantity: "1", unitPrice: "" }]);
  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));
  const updateItem = (key: string, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const parseItems = (): InvoiceLineItem[] =>
    items
      .filter((i) => i.description.trim() || i.name.trim())
      .map((i) => ({
        id: i.key,
        name: i.name.trim(),
        description: i.description.trim() || "Item",
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
        amount: (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
      }));

  const subtotal = parseItems().reduce((s, i) => s + i.amount, 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal - (Number(discount) || 0) + tax;

  function handleSubmit() {
    onSubmit({
      id: initialData?.id ?? crypto.randomUUID(),
      invoiceNumber: initialData?.invoiceNumber ?? "",
      status: initialData?.status ?? "DRAFT",
      currency: currency || "USD",
      subtotal,
      tax,
      taxRate: Number(taxRate) || 0,
      discount: Number(discount) || 0,
      total,
      issueDate: initialData?.issueDate ?? new Date().toISOString().split("T")[0],
      dueDate,
      paidAt: initialData?.paidAt ?? "",
      notes,
      quote: initialData?.quote ?? "",
      quoteId: initialData?.quoteId ?? "",
      customer,
      customerId: initialData?.customerId ?? prefill?.customerId ?? "",
      company,
      companyId: initialData?.companyId ?? prefill?.companyId ?? "",
      opportunity,
      opportunityId: initialData?.opportunityId ?? prefill?.opportunityId ?? "",
      lead: initialData?.lead ?? "",
      leadId: initialData?.leadId ?? "",
      createdBy: initialData?.createdBy ?? "",
      items: parseItems(),
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Customer</label>
          <Input placeholder="Customer name" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Company</label>
          <Input placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Opportunity</label>
          <Input placeholder="Related opportunity" value={opportunity} onChange={(e) => setOpportunity(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Currency</label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
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
          <div className="grid grid-cols-[1.4fr_1.6fr_0.6fr_0.8fr_0.8fr_auto] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <span>Product</span>
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {items.map((item) => (
            <div key={item.key} className="grid grid-cols-[1.4fr_1.6fr_0.6fr_0.8fr_0.8fr_auto] items-center gap-2">
              <Input placeholder="Product / service" value={item.name} onChange={(e) => updateItem(item.key, { name: e.target.value })} />
              <Input value={item.description} onChange={(e) => updateItem(item.key, { description: e.target.value })} />
              <Input type="number" min={0} value={item.quantity} onChange={(e) => updateItem(item.key, { quantity: e.target.value })} />
              <Input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })} />
              <div className="text-right text-sm font-medium text-slate-700">
                ${((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString()}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.key)} aria-label="Remove item">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {items.length === 0 && <p className="py-3 text-center text-xs text-slate-400">Add at least one line item.</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Discount ($)</label>
          <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Tax Rate (%)</label>
          <Input type="number" min={0} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Notes</label>
        <textarea
          className="flex min-h-[70px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Payment terms, notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Tax</span>
          <span>${tax.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Discount</span>
          <span>-${(Number(discount) || 0).toLocaleString()}</span>
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold text-slate-900 dark:text-white">
          <span>Total</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>{isEditing ? "Save Changes" : "Create Invoice"}</Button>
      </div>
    </div>
  );
}
