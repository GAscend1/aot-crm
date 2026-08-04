import { ViewRedirect } from "@/components/common/ViewRedirect";

export default function EmailRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ViewRedirect pathname="/activities" view="email" searchParams={searchParams} />
  );
}
