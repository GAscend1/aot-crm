"use client";

import { use } from "react";

import { RecordDetail } from "@/components/enterprise/RecordDetail";
import { companyService } from "@/services/index";
import type { Company } from "@/services/company.service";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <RecordDetail<Company>
      id={id}
      service={companyService}
      backHref="/companies"
      title="Company"
      getTitle={(c) => c.name}
      getDescription={(c) => `${c.industry} · ${c.size} employees`}
      renderFields={(c) => [
        { label: "Email", value: <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a> },
        { label: "Phone", value: c.phone || "-" },
        { label: "Website", value: c.website ? <a href={c.website} target="_blank" className="text-blue-600 hover:underline">{c.website}</a> : "-" },
        { label: "Industry", value: c.industry },
        { label: "Size", value: c.size },
        { label: "Employees", value: c.employeeCount.toLocaleString() },
        { label: "Revenue", value: c.revenue || "-" },
        { label: "Address", value: c.address || "-" },
        { label: "City", value: c.city },
        { label: "Country", value: c.country },
      ]}
      renderStatus={(c) => ({
        label: "Status",
        value: (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
            {c.status}
          </span>
        ),
      })}
    />
  );
}
