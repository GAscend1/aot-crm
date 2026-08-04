"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsyncSubmit } from "@/components/common/use-async-submit";
import { FormErrorBanner, FormFieldError } from "@/components/common/FormError";

import type { Customer, CustomerStatus } from "../types";

interface CustomerFormProps {
  customer?: Customer;
  /** Async save. Resolve on success; throw (or reject) on failure to stay open with errors. */
  onSave: (data: Partial<Customer>) => Promise<void>;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name ?? "");
  const [company, setCompany] = useState(customer?.company ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [position, setPosition] = useState(customer?.position ?? "");
  const [country, setCountry] = useState(customer?.country ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [status, setStatus] = useState<CustomerStatus>(
    customer?.status ?? "Active",
  );
  const [tagsInput, setTagsInput] = useState(customer?.tags?.join(", ") ?? "");

  const { saving, error, fieldErrors, submit } = useAsyncSubmit(
    onSave as (data: never) => Promise<unknown>,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await submit({
      name,
      company,
      email,
      phone,
      position,
      country,
      city,
      status,
      tags,
    } as never);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormErrorBanner message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="customer-name">
            Name
          </label>
          <Input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            aria-invalid={!!fieldErrors.name}
          />
          <FormFieldError id="customer-name-error" message={fieldErrors.name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="customer-position">
            Position
          </label>
          <Input
            id="customer-position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Job title"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="customer-company">
            Company
          </label>
          <Input
            id="customer-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="customer-email">
            Email
          </label>
          <Input
            id="customer-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            type="email"
            required
            aria-invalid={!!fieldErrors.email}
          />
          <FormFieldError id="customer-email-error" message={fieldErrors.email} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="customer-phone">
            Phone
          </label>
          <Input
            id="customer-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555-0000"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="customer-status">
            Status
          </label>
          <Select value={status} onValueChange={(v) => setStatus(v as CustomerStatus)}>
            <SelectTrigger id="customer-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="customer-country">
            Country
          </label>
          <Input
            id="customer-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="customer-city">
            City
          </label>
          <Input
            id="customer-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="customer-tags">
            Tags
          </label>
          <Input
            id="customer-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. enterprise, tech, saas"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : customer ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
