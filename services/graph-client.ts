export class GraphClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "GraphClientError";
    this.status = status;
    this.code = code;
  }
}

const INTEGRATIONS_ROOT = "/api/integrations/microsoft";

function resolveUrl(path: string, options?: RequestInit): string {
  const method = options?.method || "GET";

  if (path === "/me" && method === "GET") {
    return `${INTEGRATIONS_ROOT}/profile`;
  }

  if (path === "/me/manager" && method === "GET") {
    return `${INTEGRATIONS_ROOT}/profile`;
  }

  if (path === "/me/presence" && method === "GET") {
    return `${INTEGRATIONS_ROOT}/presence`;
  }

  if (path === "/me/sendMail" && method === "POST") {
    return `${INTEGRATIONS_ROOT}/mail/send`;
  }

  if (path === "/me/messages" && method === "POST") {
    return `${INTEGRATIONS_ROOT}/mail/drafts`;
  }

  if (path.startsWith("/me/mailFolders/drafts/messages")) {
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `${INTEGRATIONS_ROOT}/mail/drafts${query}`;
  }

  const folderMatch = path.match(/^\/me\/mailFolders\/([^/]+)\/messages(\?.*)?$/);
  if (folderMatch && method === "GET") {
    const folder = folderMatch[1];
    const query = folderMatch[2] || "";
    const newQuery = query ? query.replace(/^\?/, "?folder=" + folder + "&") : `?folder=${folder}`;
    return `${INTEGRATIONS_ROOT}/mail/messages${newQuery}`;
  }

  const replyMatch = path.match(/^\/me\/messages\/([^/]+)\/reply$/);
  if (replyMatch && method === "POST") {
    return `${INTEGRATIONS_ROOT}/mail/${replyMatch[1]}/reply`;
  }

  const replyAllMatch = path.match(/^\/me\/messages\/([^/]+)\/replyAll$/);
  if (replyAllMatch && method === "POST") {
    return `${INTEGRATIONS_ROOT}/mail/${replyAllMatch[1]}/reply-all`;
  }

  const forwardMatch = path.match(/^\/me\/messages\/([^/]+)\/forward$/);
  if (forwardMatch && method === "POST") {
    return `${INTEGRATIONS_ROOT}/mail/${forwardMatch[1]}/forward`;
  }

  if (path.startsWith("/me/calendarview")) {
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `${INTEGRATIONS_ROOT}/calendar/events${query}`;
  }

  if (path === "/me/events" || path.startsWith("/me/events?")) {
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `${INTEGRATIONS_ROOT}/calendar/events${query}`;
  }

  const eventsIdMatch = path.match(/^\/me\/events\/([^/]+)(\?.*)?$/);
  if (eventsIdMatch) {
    return `${INTEGRATIONS_ROOT}/calendar/events/${eventsIdMatch[1]}`;
  }

  const messagesMatch = path.match(/^\/me\/messages\/([^/]+)$/);
  if (messagesMatch && (method === "GET" || method === "DELETE")) {
    return `${INTEGRATIONS_ROOT}/mail/${messagesMatch[1]}`;
  }

  throw new GraphClientError(
    `Unknown Graph path: ${path}. No dedicated integration route exists for this operation.`,
    404,
    "unknown_route",
  );
}

export async function graphApi(path: string, options?: RequestInit): Promise<unknown> {
  const url = resolveUrl(path, options);

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GraphClientError(
      body.error || `Graph API returned status ${res.status}`,
      res.status,
      body.code,
    );
  }

  if (res.status === 204) return null;

  return res.json();
}
