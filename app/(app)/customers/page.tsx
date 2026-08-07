import { ViewRedirect } from "@/components/common/ViewRedirect";

export default function CustomersRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ViewRedirect pathname="/contacts" view="customers" searchParams={searchParams} />
  );
}
