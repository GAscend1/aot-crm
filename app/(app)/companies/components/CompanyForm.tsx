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

import { Company, CompanySize, CompanyStatus } from "../types";

interface CompanyFormProps {
  initialData?: Company;
  onSubmit: (data: Company) => void;
  onCancel: () => void;
}

export function CompanyForm({
  initialData,
  onSubmit,
  onCancel,
}: CompanyFormProps) {
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

  function handleSubmit() {
    onSubmit({
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
    });
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Company Name
          </label>

          <Input
            placeholder="Company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Industry
          </label>

          <Input
            placeholder="Technology"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Size
          </label>

          <Select value={size} onValueChange={(v) => setSize(v as CompanySize)}>
            <SelectTrigger>
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
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as CompanyStatus)}
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
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Address
        </label>

        <Input
          placeholder="Street address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            City
          </label>

          <Input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Country
          </label>

          <Input
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Email
          </label>

          <Input
            type="email"
            placeholder="email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Phone
          </label>

          <Input
            placeholder="+1 555-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Website
          </label>

          <Input
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Employee Count
          </label>

          <Input
            type="number"
            placeholder="0"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Revenue
        </label>

        <Input
          placeholder="$0"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button onClick={handleSubmit}>
          {isEditing ? "Save Changes" : "Create Company"}
        </Button>
      </div>
    </div>
  );
}
