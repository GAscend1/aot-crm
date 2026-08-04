"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Report } from "../types";
import { ReportForm } from "./ReportForm";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  report?: Report | null;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (report: Report) => Promise<void> | void;
}

export function ReportModal({
  open,
  onClose,
  report,
  onSave,
}: ReportModalProps) {
  const title = report ? report.name : "Create Report";
  const description = report
    ? `Editing ${report.name}`
    : "Fill in the details to create a new report.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <ReportForm
        initialData={report ?? undefined}
        onSubmit={(data) =>
          Promise.resolve(onSave(data)).then(
            () => onClose(),
            () => {
              // Save failed; keep the modal open so the user can retry.
            }
          )
        }
        onCancel={onClose}
      />
    </RecordModal>
  );
}
