"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsyncSubmit } from "@/components/common/use-async-submit";
import { FormErrorBanner, FormFieldError } from "@/components/common/FormError";

import { Company, CompanySize, CompanyStatus } from "../types";

interface CompanyFormProps {
  initialData?: Company;
  /** Async save. Resolve on success; throw (or reject) on failure to stay open with errors. */
  onSubmit: (data: Company) => Promise<void>;
  onCancel: () => void;
}

export function CompanyForm({ initialData, onSubmit, onCancel }: CompanyFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [industry, setIndustry] = useState(initialData?.industry ?? "");
  const [size, setSize] = useState<CompanySize>(initialData?.size ?? "1-10");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [city, setCity] = useState(initialData?.city ?? "");
  const [country, setCountry] = useState(initialData?.country ?? "");
  const [website, setWebsite] = useState(initialData?.website ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [employeeCount, setEmployeeCount] = useState(
    initialData?.employeeCount.toString() ?? ""
  );
  const [revenue, setRevenue] = useState(initialData?.revenue ?? "");
  const [status, setStatus] = useState<CompanyStatus>(
    initialData?.status ?? "Active"
  );

  const { saving, error, fieldErrors, submit } = useAsyncSubmit(
    onSubmit as (data: never) => Promise<unknown>,
  );

  async function handleSubmit() {
    await submit({
      id: initialData?.id ?? crypto.randomUUID(),
      name,
      industry,
      size,
      address,
      city,
      country,
      website,
      email,
      phone,
      employeeCount: Number(employeeCount),
      revenue,
      status,
      createdAt: initialData?.createdAt ?? new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    } as never);
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <FormErrorBanner message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-name">
            Company Name
          </label>

          <Input
            id="company-name"
            placeholder="Company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!fieldErrors.companyName || !!fieldErrors.name}
          />
          <FormFieldError
            message={fieldErrors.companyName ?? fieldErrors.name}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-industry">
            Industry
          </label>

          <Input
            id="company-industry"
            placeholder="Technology"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-size">
            Size
          </label>

          <Select value={size} onValueChange={(v) => setSize(v as CompanySize)}>
            <SelectTrigger id="company-size">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="1-10">1-10</SelectItem>
              <SelectItem value="11-50">11-50</SelectItem>
              <SelectItem value="51-200">51-200</SelectItem>
              <SelectItem value="201-500">201-500</SelectItem>
              <SelectItem value="500+">500+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-status">
            Status
          </label>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as CompanyStatus)}
          >
            <SelectTrigger id="company-status">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="company-address">
          Address
        </label>

        <Input
          id="company-address"
          placeholder="Street address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-city">
            City
          </label>

          <Input
            id="company-city"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-country">
            Country
          </label>

          <Input
            id="company-country"
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-email">
            Email
          </label>

          <Input
            id="company-email"
            type="email"
            placeholder="email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email}
          />
          <FormFieldError message={fieldErrors.email} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-phone">
            Phone
          </label>

          <Input
            id="company-phone"
            placeholder="+1 555-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-website">
            Website
          </label>

          <Input
            id="company-website"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="company-employees">
            Employee Count
          </label>

          <Input
            id="company-employees"
            type="number"
            placeholder="0"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="company-revenue">
          Revenue
        </label>

        <Input
          id="company-revenue"
          placeholder="$0"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>

        <Button onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Company"}
        </Button>
      </div>
    </div>
  );
}
