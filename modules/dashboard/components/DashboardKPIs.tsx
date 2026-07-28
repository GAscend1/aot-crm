import { StatCard } from "@/components/common/StatCard";
import { kpis } from "../mockData";

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
  return (
    <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon as import("lucide-react").LucideIcon}
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
