"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileIcon, FolderOpen } from "lucide-react";

import { ViewSwitcher } from "@/components/common/ViewSwitcher";
import { DocumentStats } from "./DocumentStats";
import { DocumentTable } from "./DocumentTable";
import { FileManagerView } from "../../files/components/FileManagerView";

const VIEWS = [
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "files", label: "Files", icon: FileIcon },
];

/**
 * Documents module shell. File Manager is now a filtered view of the same
 * module (legacy /files redirects here via ?view=files), matching the
 * simplified navigation while keeping the file manager reachable.
 */
export function DocumentsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams?.get("view");
  const active = VIEWS.some((v) => v.id === view) ? (view as string) : "documents";

  const handleChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("view", next);
      params.delete("record");
      router.replace(`/documents?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      <ViewSwitcher tabs={VIEWS} active={active} onChange={handleChange} tourPrefix="view" />

      {active === "documents" && (
        <>
          <DocumentStats />
          <DocumentTable />
        </>
      )}

      {active === "files" && <FileManagerView />}
    </div>
  );
}
