import { normalizeEmail } from "./email-utils";

/**
 * Pure email → CRM record matching (server + test safe).
 *
 * SECURITY: these functions only run over rows the caller already scoped to the
 * current organization (the API route builds `where: { organizationId }`
 * queries). They never query anything globally and never take an org id — the
 * org boundary is enforced by the route that produces the input rows.
 */

export interface EmailMatchSource {
  kind: "contact" | "customer" | "lead";
  id: string;
  name: string;
  email: string | null;
  company?: string | null;
  href: string;
}

export interface EmailMatchResult {
  kind: "contact" | "customer" | "lead" | "company";
  id: string;
  name: string;
  email: string;
  company?: string;
  href: string;
}

/** Match records whose address is one of the given addresses (case-insensitive). */
export function matchAddressesToRecords(
  records: EmailMatchSource[],
  addresses: string[],
): EmailMatchResult[] {
  const keys = new Set(addresses.map(normalizeEmail).filter(Boolean));
  if (keys.size === 0) return [];

  const seen = new Set<string>();
  const matches: EmailMatchResult[] = [];
  for (const r of records) {
    const key = normalizeEmail(r.email);
    if (!key || !keys.has(key)) continue;
    const dedupeKey = `${r.kind}:${r.id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    matches.push({
      kind: r.kind,
      id: r.id,
      name: r.name || r.email || "Unknown",
      email: r.email ?? "",
      company: r.company ?? undefined,
      href: r.href,
    });
  }
  return matches;
}

/** Match companies by email domain (e.g. sender@contoso.com → Contoso Ltd). */
export function matchCompaniesByDomain(
  companies: { id: string; name: string; email: string | null; href: string }[],
  addresses: string[],
): EmailMatchResult[] {
  const domains = new Set<string>();
  for (const a of addresses) {
    const at = a.indexOf("@");
    if (at > -1 && at < a.length - 1) domains.add(a.slice(at + 1).toLowerCase());
  }
  if (domains.size === 0) return [];

  const matches: EmailMatchResult[] = [];
  for (const c of companies) {
    if (!c.email) continue;
    const at = c.email.indexOf("@");
    const domain = at > -1 ? c.email.slice(at + 1).toLowerCase() : "";
    if (domain && domains.has(domain)) {
      matches.push({
        kind: "company",
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.name,
        href: c.href,
      });
    }
  }
  return matches;
}
