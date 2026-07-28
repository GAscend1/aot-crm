import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { Button } from "@/components/ui/button";

import { ReportStats } from "../components/ReportStats";
import { ReportTable } from "../components/ReportTable";

export default function ReportsManagePage() {
  return (
    <PageLayout
      title="Report Management"
      description="Create, view, and manage business reports and analytics."
      actions={
        <Link href="/reports">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      }
    >
      <ReportStats />
      <ReportTable />
    </PageLayout>
  );
}
