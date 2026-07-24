import { ReactNode } from "react";

interface ModulePageProps {
  children: ReactNode;
}

export function ModulePage({
  children,
}: ModulePageProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      {children}
    </div>
  );
}