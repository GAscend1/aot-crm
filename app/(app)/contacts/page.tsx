import { Suspense } from "react";

import { PageLayout } from "@/components/common/PageLayout";
import { ContactsView } from "./components/ContactsView";

export default function ContactsPage() {
  return (
    <PageLayout
      title="Contacts"
      description="Manage people, customer accounts, and leads — switch between People, Customers, and Leads views."
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
