import { redirect } from "next/navigation";

interface ViewRedirectProps {
  /** Target module base path, e.g. "/opportunities". */
  pathname: string;
  /** View to set, e.g. "kanban". */
  view: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Compatibility redirect for legacy module routes that have been merged into a
 * single module page with query-param views (e.g. /opportunities/kanban →
 * /opportunities?view=kanban). All other query params (like ?record=) are
 * preserved so deep links keep working.
 */
export async function ViewRedirect({
  pathname,
  view,
  searchParams,
}: ViewRedirectProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("view", view);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v !== undefined && v !== "") qs.set(key, v);
  }
  redirect(`${pathname}?${qs.toString()}`);
  return null;
}
