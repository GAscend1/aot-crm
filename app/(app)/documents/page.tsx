import { Suspense } from "react";

import { PageLayout } from "@/components/common/PageLayout";
import { DocumentsView } from "./components/DocumentsView";

export default function DocumentsPage() {
  return (
    <PageLayout
      title="Documents"
      description="Manage documents and files — switch between Documents and Files views."
    >
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        }
      >
        <DocumentsView />
      </Suspense>
    </PageLayout>
  );
}