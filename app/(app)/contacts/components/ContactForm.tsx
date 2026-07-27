"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Contact, ContactStatus } from "../types";

interface ContactFormProps {
  contact?: Contact;
}

export function ContactForm({ contact }: ContactFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            First Name
          </label>

          <Input
            placeholder="First name"
            defaultValue={contact?.firstName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Last Name
          </label>

          <Input
            placeholder="Last name"
            defaultValue={contact?.lastName}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Email
        </label>

        <Input
          type="email"
          placeholder="email@example.com"
          defaultValue={contact?.email}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Phone
        </label>

        <Input
          placeholder="+1 555-0000"
          defaultValue={contact?.phone}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Position
          </label>

          <Input
            placeholder="Job title"
            defaultValue={contact?.position}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Company
          </label>

          <Input
            placeholder="Company name"
            defaultValue={contact?.company}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Country
          </label>

          <Input
            placeholder="Country"
            defaultValue={contact?.country}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            City
          </label>

          <Input
            placeholder="City"
            defaultValue={contact?.city}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Status
        </label>

        <Select
          defaultValue={contact?.status ?? "Active"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Notes
        </label>

        <textarea
          className="h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 resize-none md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"
          placeholder="Additional notes..."
          defaultValue={contact?.notes}
        />
      </div>
    </div>
  );
}
