import { ReactNode } from "react";

interface ModulePageProps {
  children: ReactNode;
}

export function ModulePage({
  children,
}: ModulePageProps) {
  return (
    <div className="space-y-6 p-6">
      {children}
    </div>
  );
}