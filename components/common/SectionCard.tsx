interface SectionCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  children,
}: SectionCardProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold">
          {title}
        </h2>
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  );
}