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

import type { Customer, CustomerStatus } from "../types";

interface CustomerFormProps {
  customer?: Customer;
  onSave: (data: Partial<Customer>) => void;
  onCancel: () => void;
}

export function CustomerForm({
  customer,
  onSave,
  onCancel,
}: CustomerFormProps) {
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
  const [tagsInput, setTagsInput] = useState(
    customer?.tags?.join(", ") ?? "",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      name,
      company,
      email,
      phone,
      position,
      country,
      city,
      status,
      tags,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Position</label>
          <Input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Job title"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Company</label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            type="email"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Phone</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555-0000"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as CustomerStatus)}
          >
            <SelectTrigger>
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
          <label className="text-sm font-medium">Country</label>
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">City</label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Tags</label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. enterprise, tech, saas"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {customer ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
