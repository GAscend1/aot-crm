import { ReactNode } from "react";

interface ModuleHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function ModuleHeader({
  title,
  description,
  actions,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {title}
        </h1>

        <p className="text-muted-foreground">
          {description}
        </p>
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}