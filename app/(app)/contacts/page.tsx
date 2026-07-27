import { PageLayout } from "@/components/common/PageLayout";

import { ContactStats } from "./components/ContactStats";
import { ContactToolbar } from "./components/ContactToolbar";
import { ContactTable } from "./components/ContactTable";

export default function ContactsPage() {
  return (
    <PageLayout
      title="Contacts"
      description="Manage your network of business contacts, leads, and team members."
    >
      <ContactStats />

      <ContactToolbar />

      <ContactTable />
    </PageLayout>
  );
}
