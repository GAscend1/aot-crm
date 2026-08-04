import { ViewRedirect } from "@/components/common/ViewRedirect";

export default function CalendarRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ViewRedirect pathname="/activities" view="calendar" searchParams={searchParams} />
  );
}
