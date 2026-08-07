import { ViewRedirect } from "@/components/common/ViewRedirect";

export default function PipelineRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ViewRedirect pathname="/opportunities" view="kanban" searchParams={searchParams} />
  );
}
