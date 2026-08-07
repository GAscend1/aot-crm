"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Contact, Target, Users } from "lucide-react";

import { ViewSwitcher } from "@/components/common/ViewSwitcher";
import { ContactStats } from "./ContactStats";
import { ContactTable } from "./ContactTable";
import { CustomerStats } from "../../customers/components/CustomerStats";
import { CustomerTable } from "../../customers/components/CustomerTable";
import { LeadStats } from "../../leads/components/LeadStats";
import { LeadTable } from "../../leads/components/LeadTable";

const VIEWS = [
  { id: "people", label: "People", icon: Users },
  { id: "customers", label: "Customers", icon: Contact },
  { id: "leads", label: "Leads", icon: Target },
];

/**
 * Contacts module shell — the "people hub". Customers and Leads are filtered
 * views of the same module (legacy /customers and /leads redirect here via
 * ?view=customers / ?view=leads), matching the simplified navigation while
 * keeping every record type reachable.
 */
export function ContactsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams?.get("view");
  const active = VIEWS.some((v) => v.id === view)
    ? (view as string)
    : "people";

  const handleChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("view", next);
      // Switching views closes any open record workspace.
      params.delete("record");
      router.replace(`/contacts?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      <ViewSwitcher
        tabs={VIEWS}
        active={active}
        onChange={handleChange}
        tourPrefix="view"
      />

      {active === "people" && (
        <>
          <ContactStats />
          <ContactTable />
        </>
      )}

      {active === "customers" && (
        <>
          <CustomerStats />
          <CustomerTable />
        </>
      )}

      {active === "leads" && (
        <>
          <LeadStats />
          <LeadTable />
        </>
      )}
    </div>
  );
}
