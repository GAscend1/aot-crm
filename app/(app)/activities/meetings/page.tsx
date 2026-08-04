import { ViewRedirect } from "@/components/common/ViewRedirect";

export default function MeetingsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ViewRedirect pathname="/activities" view="meetings" searchParams={searchParams} />
  );
}
