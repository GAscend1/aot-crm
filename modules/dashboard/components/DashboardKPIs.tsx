"use client";

import { DollarSign, Users, Building2, Briefcase, Ticket } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useLive } from "@/hooks/use-live";
import { Events } from "@/services/events";
import { customerService } from "@/services";
import { companyService } from "@/services";
import { opportunityService } from "@/services";
import { ticketService } from "@/services";

function getVariant(
  title: string
): "default" | "primary" | "success" | "warning" | "danger" {
  switch (title) {
    case "Total Revenue":
    case "Revenue":
      return "primary";
    case "Customers":
    case "Companies":
      return "success";
    case "Opportunities":
      return "warning";
    case "Open Tickets":
      return "danger";
    default:
      return "default";
  }
}

export function DashboardKPIs() {
  const { data: customers } = useLive(
    () => customerService.findAll().then(r => r.data),
    [Events.CUSTOMER_CREATED, Events.CUSTOMER_UPDATED, Events.CUSTOMER_DELETED],
    []
  );
  const { data: companies } = useLive(
    () => companyService.findAll().then(r => r.data),
    [Events.COMPANY_CREATED, Events.COMPANY_UPDATED, Events.COMPANY_DELETED],
    []
  );
  const { data: opportunities } = useLive(
    () => opportunityService.findAll().then(r => r.data),
    [Events.OPPORTUNITY_CREATED, Events.OPPORTUNITY_UPDATED, Events.OPPORTUNITY_DELETED, Events.OPPORTUNITY_WON, Events.OPPORTUNITY_LOST],
    []
  );
  const { data: tickets } = useLive(
    () => ticketService.findAll().then(r => r.data),
    [Events.TICKET_CREATED, Events.TICKET_UPDATED, Events.TICKET_DELETED],
    []
  );

  const totalRevenue = opportunities.reduce((sum, opp) => sum + (opp as any).value || 0, 0);
  const openTickets = tickets.filter((t: any) => t.status === "Open" || t.status === "In Progress");

  const kpis = [
    { title: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: 12.5, icon: DollarSign },
    { title: "Customers", value: customers.length, change: 8.2, icon: Users },
    { title: "Companies", value: companies.length, change: -2.4, icon: Building2 },
    { title: "Opportunities", value: opportunities.length, change: 16.1, icon: Briefcase },
    { title: "Open Tickets", value: openTickets.length, change: -11.3, icon: Ticket },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon}
          variant={getVariant(kpi.title)}
          trend={{
            value: `${Math.abs(kpi.change)}%`,
            positive: kpi.change >= 0,
          }}
        />
      ))}
    </div>
  );
}
