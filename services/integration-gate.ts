import { GraphClientError } from "./graph-client";

export const GRAPH_PENDING_MESSAGE =
  "Microsoft integration is awaiting administrator approval. Contact your administrator to enable Microsoft Graph.";

export function isGraphPending(err: unknown): boolean {
  return err instanceof GraphClientError && err.status === 503;
}

export function graphPendingError(name = "Microsoft integration"): Error {
  return new Error(`${name} is awaiting administrator approval. Contact your administrator to enable Microsoft Graph.`);
}
