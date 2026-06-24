import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ListBucketsCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { createS3Client } from "../lib/s3Client";
import { useConnectionStore } from "../store/connectionStore";
import { getItemName } from "../lib/utils";
import type { S3Connection, S3Item, ListObjectsResult } from "../types";

// ────────────────────────────────────────────────────────────
// Internal Helpers
// ────────────────────────────────────────────────────────────

/** Look up a connection by ID from the Zustand store. Throws if not found. */
function getConnection(connectionId: string): S3Connection {
  const connection = useConnectionStore
    .getState()
    .connections.find((c) => c.id === connectionId);

  if (!connection) {
    throw new Error(
      `Connection "${connectionId}" not found. It may have been deleted or is not yet loaded.`,
    );
  }

  return connection;
}

/** Extract the file/folder name from the end of an S3 key. */
function nameFromKey(key: string): string {
  const trimmed = key.endsWith("/") ? key.slice(0, -1) : key;
  const idx = trimmed.lastIndexOf("/");
  return idx === -1 ? trimmed : trimmed.slice(idx + 1);
}

// ────────────────────────────────────────────────────────────
// Main Hook
// ────────────────────────────────────────────────────────────

/**
 * `useS3` — central hook exposing all S3 operations as TanStack Query
 * hooks (`useQuery` / `useMutation`).
 *
 * Usage:
 * ```tsx
 * const { listBuckets, listObjects, uploadFile, deleteItem } = useS3();
 *
 * const buckets = listBuckets(activeConnectionId);
 * const objects = listObjects(activeConnectionId, bucket, prefix);
 * const upload  = uploadFile();
 *
 * await upload.mutateAsync({ connectionId, bucket, prefix: "", file });
 * ```
 */
export function useS3() {
  // ── Queries ────────────────────────────────────────────────

  /**
   * List all buckets for a connection.
   * Returns `UseQueryResult<S3Item[]>`.
   */
  function listBuckets(connectionId: string | null) {
    return useQuery({
      queryKey: ["s3", "buckets", connectionId],
      enabled: !!connectionId,
      queryFn: async (): Promise<S3Item[]> => {
        const connection = getConnection(connectionId!);

        // Cloudflare R2 dan Backblaze B2 do not support ListBuckets
        if (connection.provider === "r2" || connection.provider === "b2") {
          return [];
        }

        const client = createS3Client(connection);
        const res = await client.send(new ListBucketsCommand({}));

        return (res.Buckets ?? []).map((b): S3Item => ({
          key: b.Name ?? "",
          name: b.Name ?? "",
          type: "bucket",
          lastModified: b.CreationDate,
        }));
      },
    });
  }

  /**
   * List objects (files + folders) inside a bucket/prefix.
   * Returns `UseQueryResult<ListObjectsResult>`.
   */
  function listObjects(
    connectionId: string | null,
    bucket: string | null,
    prefix: string,
  ) {
    return useQuery({
      queryKey: ["s3", "objects", connectionId, bucket, prefix],
      enabled: !!connectionId && !!bucket,
      queryFn: async (): Promise<ListObjectsResult> => {
        const client = createS3Client(getConnection(connectionId!));
        const res = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket!,
            Prefix: prefix || undefined,
            Delimiter: "/",
          }),
        );

        const items: S3Item[] = [];

        // CommonPrefixes → virtual folders
        for (const cp of res.CommonPrefixes ?? []) {
          if (!cp.Prefix) continue;
          items.push({
            key: cp.Prefix,
            name: getItemName(cp.Prefix, prefix),
            type: "folder",
          });
        }

        // Contents → files
        for (const obj of res.Contents ?? []) {
          if (!obj.Key) continue;
          // Skip the folder placeholder that some S3 implementations include
          if (obj.Key === prefix) continue;
          items.push({
            key: obj.Key,
            name: getItemName(obj.Key, prefix),
            type: "file",
            size: obj.Size,
            lastModified: obj.LastModified,
            etag: obj.ETag,
            storageClass: obj.StorageClass,
          });
        }

        return {
          items,
          isTruncated: res.IsTruncated ?? false,
          continuationToken: res.NextContinuationToken,
        };
      },
    });
  }

  // ── Mutations (pre-created at top level) ───────────────────

  /**
   * Download a file via presigned URL (browser-based).
   * For files > 100 MB the Rust command should be used instead.
   */
  const downloadFile = useMutation({
    mutationFn: async ({
      connectionId,
      bucket,
      key,
    }: {
      connectionId: string;
      bucket: string;
      key: string;
    }): Promise<void> => {
      const client = createS3Client(getConnection(connectionId));
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 300 },
      );

      const response = await tauriFetch(url);
      if (!response.ok) {
        throw new Error(
          `Download failed for "${key}": HTTP ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Try showSaveFilePicker (File System Access API — modern WebView2)
      try {
        const handle = await (window as any).showSaveFilePicker?.({
          suggestedName: nameFromKey(key),
        });
        if (handle) {
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          URL.revokeObjectURL(blobUrl);
          return;
        }
      } catch {
        // Fallback: user cancelled or API unavailable
      }

      // Fallback: anchor click with delayed cleanup
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = nameFromKey(key);
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
      }, 5000);
    },
  });

  /**
   * Upload a single file to S3.
   * Automatically prepends the current prefix to the file name.
   */
  const uploadFile = useMutation({
    mutationFn: async ({
      connectionId,
      bucket,
      prefix,
      file,
    }: {
      connectionId: string;
      bucket: string;
      prefix: string;
      file: File;
    }): Promise<void> => {
      const client = createS3Client(getConnection(connectionId));
      const key = `${prefix}${file.name}`;

      const res = await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file,
          ContentType: file.type || "application/octet-stream",
        }),
      );

      if (res.$metadata.httpStatusCode && res.$metadata.httpStatusCode >= 400) {
        throw new Error(
          `Upload failed for "${file.name}": server returned HTTP ${res.$metadata.httpStatusCode}`,
        );
      }
    },
  });

  /**
   * Delete a single object or folder placeholder from S3.
   */
  const deleteItem = useMutation({
    mutationFn: async ({
      connectionId,
      bucket,
      key,
    }: {
      connectionId: string;
      bucket: string;
      key: string;
    }): Promise<void> => {
      const conn = getConnection(connectionId);
      const client = createS3Client(conn);

      // B2 with versioning: after creating the hide marker,
      // permanently delete all versions + delete markers
      if (conn.provider === "b2") {
        // Step 1: list all versions (including delete markers)
        const versions = await client.send(
          new ListObjectVersionsCommand({ Bucket: bucket, Prefix: key }),
        );

        const all: { Key: string; VersionId: string }[] = [];

        for (const v of versions.Versions ?? []) {
          if (v.Key === key && v.VersionId) all.push({ Key: v.Key, VersionId: v.VersionId });
        }
        for (const m of versions.DeleteMarkers ?? []) {
          if (m.Key === key && m.VersionId) all.push({ Key: m.Key, VersionId: m.VersionId });
        }

        if (all.length > 0) {
          await client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: all, Quiet: true },
            }),
          );
        }

        // If no versions found (delete marker already created by previous call), just do a regular delete
        if (all.length === 0) {
          await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        }
        return;
      }

      // Standard S3: regular delete
      const res = await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
      );

      if (res.DeleteMarker === undefined && res.$metadata.httpStatusCode &&
          res.$metadata.httpStatusCode >= 400) {
        throw new Error(
          `Delete failed for "${key}": server returned HTTP ${res.$metadata.httpStatusCode}`,
        );
      }
    },
  });

  /**
   * Create a virtual folder by putting an empty object whose key ends with "/".
   */
  const createFolder = useMutation({
    mutationFn: async ({
      connectionId,
      bucket,
      prefix,
      folderName,
    }: {
      connectionId: string;
      bucket: string;
      prefix: string;
      folderName: string;
    }): Promise<void> => {
      if (!folderName || folderName.includes("/")) {
        throw new Error(
          `Invalid folder name "${folderName}". Name must not be empty or contain "/".`,
        );
      }

      const client = createS3Client(getConnection(connectionId));
      const key = `${prefix}${folderName}/`;

      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: "" }),
      );
    },
  });

  /**
   * Generate a presigned GET URL for an object (valid for 1 hour).
   */
  const getPresignedUrl = useMutation({
    mutationFn: async ({
      connectionId,
      bucket,
      key,
    }: {
      connectionId: string;
      bucket: string;
      key: string;
    }): Promise<string> => {
      const client = createS3Client(getConnection(connectionId));
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 3600 },
      );
    },
  });

  /**
   * Rename (move) an S3 object by copying it to a new key then deleting
   * the original. Works for files; for folders each child must be renamed
   * individually.
   */
  const renameItem = useMutation({
    mutationFn: async ({
      connectionId,
      bucket,
      oldKey,
      newKey,
    }: {
      connectionId: string;
      bucket: string;
      oldKey: string;
      newKey: string;
    }): Promise<void> => {
      if (oldKey === newKey) {
        throw new Error("New name must be different from the current name.");
      }

      const client = createS3Client(getConnection(connectionId));

      // 1. Copy to new key
      console.log("Rename:", { bucket, oldKey, newKey });
      const copyRes = await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: encodeURIComponent(`${bucket}/${oldKey}`),
          Key: newKey,
        }),
      );

      if (copyRes.$metadata.httpStatusCode &&
          copyRes.$metadata.httpStatusCode >= 400) {
        throw new Error(
          `Rename failed at copy step for "${oldKey}": HTTP ${copyRes.$metadata.httpStatusCode}`,
        );
      }

      // 2. Delete original
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: oldKey }),
      );
    },
  });

  /**
   * Fetch object metadata (size, last-modified, content-type, etc.)
   * without downloading the body. Useful for "Get Info" dialogs.
   */
  const headObject = useMutation({
    mutationFn: async ({
      connectionId,
      bucket,
      key,
    }: {
      connectionId: string;
      bucket: string;
      key: string;
    }) => {
      const client = createS3Client(getConnection(connectionId));
      const res = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );

      return {
        size: res.ContentLength,
        lastModified: res.LastModified,
        contentType: res.ContentType,
        etag: res.ETag,
        storageClass: res.StorageClass,
      };
    },
  });

  return {
    // Queries (return UseQueryResult)
    listBuckets,
    listObjects,

    // Mutations (return UseMutationResult)
    downloadFile,
    uploadFile,
    deleteItem,
    createFolder,
    getPresignedUrl,
    renameItem,
    headObject,
  };
}
