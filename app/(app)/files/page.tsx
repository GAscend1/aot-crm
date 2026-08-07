import { ViewRedirect } from "@/components/common/ViewRedirect";

export default function FilesRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ViewRedirect pathname="/documents" view="files" searchParams={searchParams} />
  );
}
