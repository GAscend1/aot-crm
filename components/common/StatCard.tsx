import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-[color:var(--primary)]",
  success: "bg-success-soft text-[color:var(--success)]",
  warning: "bg-warning-soft text-[color:var(--warning)]",
  danger: "bg-danger-soft text-[color:var(--danger)]",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = "default",
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-surface-raised p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
        <div className={clsx("rounded-lg p-2.5", variantStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 border-t pt-3">
          {trend.positive ? (
            <TrendingUp className="h-3.5 w-3.5 text-[color:var(--success)]" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-[color:var(--danger)]" />
          )}
          <span
            className={clsx(
              "text-xs font-medium",
              trend.positive ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"
            )}
          >
            {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
