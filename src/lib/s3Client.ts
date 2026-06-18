import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import type { S3Connection } from "../types";

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
      // AWS SDK resolves the endpoint automatically from the region
      return undefined;

    case "minio":
      if (!endpoint) {
        throw new Error("MinIO connections require an endpoint URL (e.g. http://localhost:9000).");
      }
      return endpoint;

    case "r2":
      // Cloudflare R2 exposes S3-compatible API at:
      // https://{accountId}.r2.cloudflarestorage.com
      if (endpoint) return endpoint;
      throw new Error("Cloudflare R2 connections require an endpoint URL (https://{accountId}.r2.cloudflarestorage.com).");

    case "b2":
      // Backblaze B2 S3 endpoint: https://s3.{region}.backblazeb2.com
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
