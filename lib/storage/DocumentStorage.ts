import { createHash } from "node:crypto";

export interface UploadedFileResult {
  storageKey: string;
  checksum: string;
  size: number;
}

/**
 * Provider-independent private document storage.
 * Implementations must never expose signed URLs; callers receive
 * short-lived download URLs only after authentication and permission checks.
 */
export interface DocumentStorage {
  readonly provider: string;
  upload(
    bucket: string,
    key: string,
    data: Uint8Array,
    contentType: string
  ): Promise<UploadedFileResult>;
  createDownloadUrl(bucket: string, key: string, expiresInSeconds?: number): Promise<string>;
  delete(bucket: string, key: string): Promise<void>;
}

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
  return cleaned || "file";
}

export function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function resolveBucket(envBucket?: string): string {
  const raw = envBucket || process.env.SUPABASE_STORAGE_BUCKET || "crm-documents";
  return raw.replace(/^"|"$/g, "").trim();
}

export class SupabaseDocumentStorage implements DocumentStorage {
  readonly provider = "supabase";

  private get url(): string {
    return process.env.SUPABASE_URL || "";
  }

  private get serviceRoleKey(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(`${this.url}/storage/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Supabase storage ${res.status}: ${body.slice(0, 200)}`);
    }
    return res;
  }

  async upload(
    bucket: string,
    key: string,
    data: Uint8Array,
    contentType: string
  ): Promise<UploadedFileResult> {
    await this.request(`/object/${bucket}/${encodeURI(key)}`, {
      method: "POST",
      body: new Blob([data as BlobPart], { type: contentType }),
    });
    return {
      storageKey: key,
      checksum: sha256(data),
      size: data.byteLength,
    };
  }

  async createDownloadUrl(bucket: string, key: string, expiresInSeconds = 3600): Promise<string> {
    const res = await this.request(`/object/sign/${bucket}/${encodeURI(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });
    const json = (await res.json()) as { signedURL?: string };
    if (!json.signedURL) throw new Error("Supabase storage: no signed URL returned");
    return `${this.url}/storage/v1${json.signedURL}`;
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.request(`/object/${bucket}/${encodeURI(key)}`, { method: "DELETE" });
  }
}

/**
 * Extension point for Azure Blob Storage. Kept as an interface-compatible
 * stub so the provider can be swapped via configuration without UI changes.
 */
export class AzureBlobDocumentStorage implements DocumentStorage {
  readonly provider = "azure";
  constructor() {
    throw new Error(
      "AzureBlobDocumentStorage is not configured. Configure AZURE_STORAGE_CONNECTION_STRING to enable it."
    );
  }
  async upload(): Promise<UploadedFileResult> {
    throw new Error("Not implemented");
  }
  async createDownloadUrl(): Promise<string> {
    throw new Error("Not implemented");
  }
  async delete(): Promise<void> {
    throw new Error("Not implemented");
  }
}

export function resolveDocumentStorage(): DocumentStorage {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "supabase";
  if (provider === "azure") return new AzureBlobDocumentStorage();
  return new SupabaseDocumentStorage();
}
