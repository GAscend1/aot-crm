import { ReactNode } from "react";
import clsx from "clsx";

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageLayout({
  title,
  description,
  children,
  actions,
  className,
}: PageLayoutProps) {
  return (
    <div className={clsx("mx-auto flex w-full max-w-7xl flex-col gap-5 p-5 lg:p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
