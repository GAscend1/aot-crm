/**
 * Email display helpers (client-safe).
 *
 * Email bodies are untrusted external content — never render them as raw HTML.
 * `emailTextFromHtml` extracts the text content via DOMParser, which never
 * executes scripts or event handlers, so HTML bodies display safely without
 * `dangerouslySetInnerHTML` or any other unsafe rendering path.
 */

/** Page size used by the mailbox list + "Load more" pagination. */
export const EMAIL_PAGE_SIZE = 25;

/** Lower-case, trimmed address — the canonical key for address matching. */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Safely convert an email body (possibly HTML) into displayable plain text.
 * HTML is never rendered — only its text content is extracted.
 */
export function emailTextFromHtml(htmlOrText: string): string {
  const raw = htmlOrText ?? "";
  if (!raw) return "";

  const looksLikeHtml = /<\/?[a-z][^>]*>/i.test(raw);
  if (!looksLikeHtml) return raw;

  if (typeof DOMParser !== "undefined") {
    // DOMParser never executes <script> or event handlers; textContent is safe.
    const doc = new DOMParser().parseFromString(raw, "text/html");
    return (doc.body?.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
  }

  // Server/SSR fallback: strip tags (never executes anything).
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Human-readable attachment size. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
