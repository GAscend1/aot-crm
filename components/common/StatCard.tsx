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
  default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  primary: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  success: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
  danger: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
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
    <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={clsx("rounded-lg p-2.5", variantStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 border-t pt-3 dark:border-slate-700">
          {trend.positive ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span
            className={clsx(
              "text-xs font-medium",
              trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {trend.value}
          </span>
          <span className="text-xs text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
