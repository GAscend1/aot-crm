"use client";

import { useState } from "react";
import { Building2, History, Inbox } from "lucide-react";
import { EntityTabs } from "@/components/enterprise/EntityTabs";
import { OrganizationsList } from "./OrganizationsList";
import { SalesInquiriesTable } from "./SalesInquiriesTable";
import { SubscriptionAuditList } from "./SubscriptionAuditList";

const TABS = [
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "inquiries", label: "Demo / Sales Requests", icon: Inbox },
  { id: "audit", label: "Access Audit", icon: History },
];

/**
 * Platform Owner section — embedded in the existing CRM Administration page
 * (no separate owner app). Visible only to designated AOT platform-owner
 * accounts (enforced server-side by the underlying /api/platform/* routes).
 */
export function PlatformOwnerSection() {
  const [active, setActive] = useState("organizations");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-raised">
        <EntityTabs
          id="platform-owner"
          tabs={TABS}
          active={active}
          onChange={setActive}
        />
      </div>

      <section
        role="tabpanel"
        aria-labelledby={`platform-owner-tab-${active}`}
        className="space-y-4"
      >
        {active === "organizations" && <OrganizationsList />}
        {active === "inquiries" && <SalesInquiriesTable />}
        {active === "audit" && <SubscriptionAuditList />}
      </section>
    </div>
  );
}
