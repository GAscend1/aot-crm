"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const companies = [
  "All Companies",
  "Microsoft",
  "Google",
  "Amazon",
  "Apple",
  "Meta",
  "Netflix",
  "Tesla",
  "Spotify",
  "Stripe",
  "Airbnb",
  "Shopify",
  "Datadog",
];

export function ContactFilters() {
  return (
    <div className="flex items-center gap-2">
      <Select>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Company" />
        </SelectTrigger>

        <SelectContent>
          {companies.map((company) => (
            <SelectItem key={company} value={company}>
              {company}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
