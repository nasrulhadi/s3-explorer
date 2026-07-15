import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { S3Connection } from "../types";

// ─── Custom HTTP handler that uses Tauri's native fetch ─────

/**
 * Custom HttpHandler that routes AWS SDK HTTP requests through Tauri's
 * native HTTP client (plugin-http / reqwest) instead of the browser's
 * `fetch`. This bypasses CORS, which blocks requests to S3-compatible
 * providers (R2, B2, MinIO, etc.) that don't serve CORS headers.
 *
 * Mirrors the behaviour of @smithy/fetch-http-handler's FetchHttpHandler
 * but calls Tauri's `fetch` instead of `globalThis.fetch`.
 */
const tauriHttpHandler = {
  async handle(request: {
    protocol: string;
    hostname: string;
    port?: number;
    path: string;
    query?: Record<string, string | string[]>;
    method: string;
    headers: Record<string, string>;
    body?: string;
    fragment?: string;
    username?: string;
    password?: string;
  }) {
    // Build URL (same logic as @smithy/fetch-http-handler)
    const queryString = buildQueryString(request.query ?? {});
    let path = request.path;
    if (queryString) path += `?${queryString}`;
    if (request.fragment) path += `#${request.fragment}`;

    let auth = "";
    if (request.username != null || request.password != null) {
      auth = `${request.username ?? ""}:${request.password ?? ""}@`;
    }

    const url = `${request.protocol}//${auth}${request.hostname}${
      request.port ? `:${request.port}` : ""
    }${path}`;

    const method = request.method;
    const body =
      method === "GET" || method === "HEAD" ? undefined : request.body;

    // Build headers as plain object, skipping "host" (derived from URL).
    // Use plain object instead of Headers() so forbidden headers like
    // "content-length" can pass through when needed.
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      if (key.toLowerCase() === "host") continue;
      headers[key.toLowerCase()] = value;
    }

    const fetchBody = body !== undefined ? body : undefined;

    // Use Tauri's native fetch (bypasses CORS)
    const response = await tauriFetch(url, {
      method,
      headers,
      body: fetchBody,
    });

    // Read the full response body as ArrayBuffer → Uint8Array
    const buffer = await response.arrayBuffer();

    // Build the headers object the SDK expects
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value: string, key: string) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    return {
      response: {
        statusCode: response.status,
        headers: responseHeaders,
        body: new Uint8Array(buffer),
      },
    };
  },

  destroy() {
    // Nothing to clean up
  },
};

/** Replicates @smithy/core/protocols buildQueryString */
function buildQueryString(query: Record<string, string | string[]>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join("&");
}

// ─── Endpoint resolution ────────────────────────────────────

/**
 * Build the appropriate S3 endpoint URL based on the provider.
 * - AWS:          default endpoint (handled by SDK), no override needed
 * - MinIO:        custom endpoint provided by user, e.g. "http://localhost:9000"
 * - Cloudflare R2: https://{accountId}.r2.cloudflarestorage.com
 * - Backblaze B2:  https://s3.{region}.backblazeb2.com
 * - custom:       user-supplied endpoint as-is
 */
function resolveEndpoint(connection: S3Connection): string | undefined {
  const { provider, endpoint, region } = connection;

  switch (provider) {
    case "aws":
      return undefined;

    case "minio":
      if (!endpoint) {
        throw new Error("MinIO connections require an endpoint URL (e.g. http://localhost:9000).");
      }
      return endpoint;

    case "r2":
      if (endpoint) return endpoint;
      throw new Error("Cloudflare R2 connections require an endpoint URL (https://{accountId}.r2.cloudflarestorage.com).");

    case "b2":
      if (endpoint) return endpoint;
      if (!region) {
        throw new Error("Backblaze B2 connections require a region (e.g. us-west-004).");
      }
      return `https://s3.${region}.backblazeb2.com`;

    case "custom":
      if (!endpoint) {
        throw new Error("Custom S3 connections require an endpoint URL.");
      }
      return endpoint;

    default:
      throw new Error(`Unsupported S3 provider: ${provider}`);
  }
}

// ─── Factory ────────────────────────────────────────────────

/**
 * Factory: create a configured S3Client instance from an S3Connection.
 *
 * Usage:
 * ```ts
 * const client = createS3Client(connection);
 * await client.send(new ListBucketsCommand({}));
 * ```
 */
export function createS3Client(connection: S3Connection): S3Client {
  const endpoint = resolveEndpoint(connection);

  const config: S3ClientConfig = {
    region: connection.region || "us-east-1",
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
    // Route all SDK HTTP requests through Tauri's native HTTP client
    // to bypass CORS (WebView blocks requests to providers without CORS headers)
    requestHandler: tauriHttpHandler as never,
  };

  if (endpoint) {
    config.endpoint = endpoint;

    // For non-AWS providers, disable bucket endpoint rewriting
    // (MinIO and most S3-compatible services use path-style addressing)
    if (connection.provider !== "aws") {
      config.forcePathStyle = true;
    }
  }

  return new S3Client(config);
}
