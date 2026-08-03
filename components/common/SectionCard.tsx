interface SectionCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  children,
}: SectionCardProps) {
  return (
    <div className="rounded-xl border bg-surface-raised shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {title}
        </h2>
      </div>

      <div className="p-4">
        {children}
      </div>
    </div>
  );
}