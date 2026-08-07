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

import type { Contact, ContactStatus } from "../types";

interface ContactFormProps {
  contact?: Contact;
  /** Async save. Resolve on success; throw (or reject) on failure to stay open with errors. */
  onSave: (data: Partial<Contact>) => Promise<void>;
  onCancel: () => void;
}

export function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
  const [firstName, setFirstName] = useState(contact?.firstName ?? "");
  const [lastName, setLastName] = useState(contact?.lastName ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [position, setPosition] = useState(contact?.position ?? "");
  const [company, setCompany] = useState(contact?.company ?? "");
  const [country, setCountry] = useState(contact?.country ?? "");
  const [city, setCity] = useState(contact?.city ?? "");
  const [status, setStatus] = useState<ContactStatus>(
    contact?.status ?? "Active",
  );
  const [notes, setNotes] = useState(contact?.notes ?? "");

  const { saving, error, fieldErrors, submit } = useAsyncSubmit(
    onSave as (data: never) => Promise<unknown>,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      firstName,
      lastName,
      email,
      phone,
      position,
      company,
      country,
      city,
      status,
      notes,
    } as never);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormErrorBanner message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-first">
            First Name
          </label>
          <Input
            id="contact-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
            aria-invalid={!!fieldErrors.firstName}
          />
          <FormFieldError id="contact-first-error" message={fieldErrors.firstName} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-last">
            Last Name
          </label>
          <Input
            id="contact-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            required
            aria-invalid={!!fieldErrors.lastName}
          />
          <FormFieldError id="contact-last-error" message={fieldErrors.lastName} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-email">
            Email
          </label>
          <Input
            id="contact-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            type="email"
            required
            aria-invalid={!!fieldErrors.email}
          />
          <FormFieldError id="contact-email-error" message={fieldErrors.email} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-phone">
            Phone
          </label>
          <Input
            id="contact-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555-0000"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-position">
            Position
          </label>
          <Input
            id="contact-position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Job title"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-company">
            Company
          </label>
          <Input
            id="contact-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-country">
            Country
          </label>
          <Input
            id="contact-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-city">
            City
          </label>
          <Input
            id="contact-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="contact-status">
            Status
          </label>
          <Select value={status} onValueChange={(v) => setStatus(v as ContactStatus)}>
            <SelectTrigger id="contact-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="contact-notes">
            Notes
          </label>
          <textarea
            id="contact-notes"
            className="h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 resize-none md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : contact ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
