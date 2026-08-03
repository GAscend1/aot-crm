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
    <div className={clsx("mx-auto flex w-full max-w-[1440px] flex-col gap-4 p-4 lg:p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">
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
