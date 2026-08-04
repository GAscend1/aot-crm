import { Suspense } from "react";

import { PageLayout } from "@/components/common/PageLayout";
import { ContactsView } from "./components/ContactsView";

export default function ContactsPage() {
  return (
    <PageLayout
      title="Contacts"
      description="Manage people and customer accounts — switch between People and Customers views."
    >
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        }
      >
        <ContactsView />
      </Suspense>
    </PageLayout>
  );
}
