import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
      <Inbox className="mb-4 h-12 w-12 text-slate-400" />

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}