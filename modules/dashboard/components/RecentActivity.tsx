import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";

export function RecentActivity() {
  return (
    <SectionCard title="Recent Activity">
      <EmptyState
        title="No activity yet"
        description="Recent CRM activity will appear here once users begin interacting with the system."
      />
    </SectionCard>
  );
}