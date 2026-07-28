import { PageLayout } from "@/components/common/PageLayout";
import { OpportunityKanban } from "./OpportunityKanban";

export default function OpportunitiesKanbanPage() {
  return (
    <PageLayout
      title="Opportunity Pipeline"
      description="Drag and drop opportunities through the sales pipeline stages."
    >
      <OpportunityKanban />
    </PageLayout>
  );
}
