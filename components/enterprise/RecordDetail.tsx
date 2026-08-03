"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  DetailView,
  DetailSection,
  DetailField,
  DetailGrid,
} from "./DetailView";
import { TagInput } from "./TagInput";
import { Timeline } from "./Timeline";
import { SectionCard } from "@/components/common/SectionCard";
import { useToastContext } from "@/app/(app)/AppProviders";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

interface RecordDetailProps<T extends { id: string }> {
  id: string;
  service: {
    findById: (id: string) => Promise<T | null>;
    update: (id: string, data: Partial<T>) => Promise<T>;
    delete: (id: string) => Promise<void>;
  };
  backHref: string;
  title: string;
  getTitle: (record: T) => string;
  getDescription?: (record: T) => string;
  renderFields: (record: T) => { label: string; value: ReactNode }[];
  renderStatus?: (record: T) => { label: string; value: ReactNode };
  renderTags?: (record: T) => string[];
  onTagsChange?: (record: T, tags: string[]) => Promise<void>;
  quickActions?: (record: T) => QuickAction[];
  extraSections?: (record: T) => ReactNode;
  onLoaded?: (record: T) => void;
}

export function RecordDetail<T extends { id: string }>({
  id,
  service,
  backHref,
  title,
  getTitle,
  getDescription,
  renderFields,
  renderStatus,
  renderTags,
  onTagsChange,
  quickActions,
  extraSections,
  onLoaded,
}: RecordDetailProps<T>) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [record, setRecord] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    service.findById(id).then((result) => {
      if (!result) {
        router.replace(backHref);
        return;
      }
      setRecord(result);
      setLoading(false);
      onLoaded?.(result);
    });
  }, [id, service, router, backHref, onLoaded]);

  const handleDelete = useCallback(async () => {
    if (!record) return;
    try {
      await service.delete(record.id);
      success(`${title} deleted`);
      router.replace(backHref);
    } catch {
      showError("Error", `Failed to delete ${title.toLowerCase()}.`);
    }
  }, [record, service, success, showError, router, backHref, title]);

  const handleTagsChange = useCallback(
    async (tags: string[]) => {
      if (!record || !onTagsChange) return;
      await onTagsChange(record, tags);
      const updated = await service.update(record.id, { tags } as unknown as Partial<T>);
      setRecord(updated);
    },
    [record, onTagsChange, service]
  );

  if (loading || !record) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const tags = renderTags?.(record);
  const status = renderStatus?.(record);
  const actions = quickActions?.(record);
  const fields = renderFields(record);
  const fieldGroups = chunkArray(fields, 3);

  return (
    <DetailView
      title={getTitle(record)}
      description={getDescription?.(record)}
      backHref={backHref}
      onDelete={handleDelete}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {fieldGroups.map((group, i) => (
            <DetailSection key={i} title={i === 0 ? "Details" : "Additional Info"}>
              <DetailGrid>
                {group.map((field) => (
                  <DetailField key={field.label} label={field.label} value={field.value} />
                ))}
              </DetailGrid>
            </DetailSection>
          ))}

          {tags && onTagsChange && (
            <DetailSection title="Tags">
              <TagInput
                tags={tags}
                onChange={handleTagsChange}
                suggestions={["enterprise", "tech", "saas", "startup"]}
              />
            </DetailSection>
          )}

          {extraSections?.(record)}

          <DetailSection title="Activity Timeline">
            <Timeline
              entries={[
                {
                  id: "1",
                  action: "created" as const,
                  userName: "System",
                  timestamp: (record as Record<string, unknown>).createdAt as string ?? new Date().toISOString(),
                },
              ]}
            />
          </DetailSection>
        </div>

        <div className="space-y-6">
          {status && (
            <DetailSection title="Status">
              <DetailField label={status.label} value={status.value} />
              <div className="mt-4">
                <DetailField label="Created" value={(record as Record<string, unknown>).createdAt as string ?? "-"} />
              </div>
              <div className="mt-4">
                <DetailField label="Updated" value={(record as Record<string, unknown>).updatedAt as string ?? "-"} />
              </div>
            </DetailSection>
          )}

          {actions && actions.length > 0 && (
            <SectionCard title="Quick Actions">
              <div className="flex flex-col gap-2">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </button>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </DetailView>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
