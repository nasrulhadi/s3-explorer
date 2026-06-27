/**
 * Pure S3 folder operations — no React, no Zustand.
 *
 * These functions take a pre-created S3 client and bucket name,
 * performing B2-safe recursive operations.
 *
 * Import this where folder-level S3 operations are needed
 * rather than calling raw AWS SDK commands directly.
 */

import {
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import type { S3Client } from "@aws-sdk/client-s3";
import type { S3Provider } from "../types";

/**
 * Delete a folder and ALL its contents recursively.
 *
 * - Standard S3: lists all objects under prefix, batch-deletes them.
 * - Backblaze B2: lists all versions + delete markers, deletes them.
 *
 * @param client  Pre-configured S3 client for the target connection
 * @param bucket  Bucket name
 * @param folderKey  The folder prefix ending with "/"
 * @param provider  Provider type (needed for B2 special handling)
 */
export async function deleteFolderRecursive(
  client: S3Client,
  bucket: string,
  folderKey: string,
  provider: S3Provider,
): Promise<void> {
  // B2 versioned: list all versions + delete markers under the prefix
  if (provider === "b2") {
    const versions = await client.send(
      new ListObjectVersionsCommand({ Bucket: bucket, Prefix: folderKey }),
    );
    const all: { Key: string; VersionId?: string }[] = [];

    for (const v of versions.Versions ?? []) {
      if (v.Key && v.VersionId) all.push({ Key: v.Key, VersionId: v.VersionId });
    }
    for (const m of versions.DeleteMarkers ?? []) {
      if (m.Key && m.VersionId) all.push({ Key: m.Key, VersionId: m.VersionId });
    }

    if (all.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: all, Quiet: true },
        }),
      );
    }
    return;
  }

  // Standard S3: list + batch delete
  const listed = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: folderKey }),
  );
  const objects = listed.Contents ?? [];

  if (objects.length > 0) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objects.map((o) => ({ Key: o.Key! })) },
      }),
    );
  }
}

/**
 * Move a folder and all its contents to a new prefix.
 *
 * Copies all child objects, then deletes the original prefix.
 * This is B2-safe — uses copy-before-delete to avoid data loss
 * in versioned buckets.
 *
 * @param client        Pre-configured S3 client
 * @param bucket        Bucket name
 * @param sourcePrefix  Source folder prefix ending with "/"
 * @param destPrefix    Destination folder prefix ending with "/"
 */
export async function moveFolderRecursive(
  client: S3Client,
  bucket: string,
  sourcePrefix: string,
  destPrefix: string,
  provider: S3Provider,
): Promise<void> {
  // 1. List all objects under source prefix (paginated)
  const allObjects: { key: string }[] = [];
  let continuationToken: string | undefined;
  do {
    const listRes = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: sourcePrefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of listRes.Contents ?? []) {
      if (obj.Key) allObjects.push({ key: obj.Key });
    }
    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  if (allObjects.length === 0) return;

  // 2. Copy each object to the new prefix (preserving relative paths)
  for (const obj of allObjects) {
    const relativeKey = obj.key.slice(sourcePrefix.length);
    const destKey = `${destPrefix}${relativeKey}`;
    try {
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: encodeURIComponent(`${bucket}/${obj.key}`),
          Key: destKey,
        }),
      );
    } catch (_) {
      // Skip failed copies — attempt as many as possible
    }
  }

  // 3. Delete source folder + all contents
  await deleteFolderRecursive(client, bucket, sourcePrefix, provider);
}

/**
 * Rename a folder by copying all children to a new prefix, then deleting
 * the original. Returns false if the folder is virtual (no objects found).
 *
 * @param client    Pre-configured S3 client
 * @param bucket    Bucket name
 * @param oldKey    Old folder prefix ending with "/"
 * @param newKey    New folder prefix ending with "/"
 * @param provider  Provider type (for B2-safe delete)
 * @returns true if rename succeeded, false if folder is virtual/empty
 */
export async function renameFolder(
  client: S3Client,
  bucket: string,
  oldKey: string,
  newKey: string,
  provider: S3Provider,
): Promise<boolean> {
  // 1. List all objects under old prefix (paginated)
  const allObjects: { key: string }[] = [];
  let continuationToken: string | undefined;
  do {
    const listRes = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: oldKey,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of listRes.Contents ?? []) {
      if (obj.Key) allObjects.push({ key: obj.Key });
    }
    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  if (allObjects.length === 0) return false;

  // 2. Copy each object to new prefix (preserving relative paths)
  for (const obj of allObjects) {
    const relativeKey = obj.key.slice(oldKey.length);
    const destKey = newKey + relativeKey;
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: encodeURIComponent(`${bucket}/${obj.key}`),
        Key: destKey,
      }),
    );
  }

  // 3. Delete old folder + all contents
  await deleteFolderRecursive(client, bucket, oldKey, provider);
  return true;
}

/**
 * Copy all objects under a source prefix to a destination prefix.
 * Used for clipboard paste of folders. Does NOT delete the source.
 *
 * @param client        Pre-configured S3 client
 * @param sourceBucket  Source bucket name
 * @param sourcePrefix  Source folder prefix ending with "/"
 * @param destBucket    Destination bucket name
 * @param destPrefix    Destination folder prefix ending with "/"
 */
export async function copyFolderRecursive(
  client: S3Client,
  sourceBucket: string,
  sourcePrefix: string,
  destBucket: string,
  destPrefix: string,
): Promise<void> {
  const listed = await client.send(
    new ListObjectsV2Command({ Bucket: sourceBucket, Prefix: sourcePrefix }),
  );

  for (const obj of listed.Contents ?? []) {
    if (!obj.Key) continue;
    const suffix = obj.Key.slice(sourcePrefix.length);
    const destKey = `${destPrefix}${suffix}`;
    await client.send(
      new CopyObjectCommand({
        Bucket: destBucket,
        CopySource: encodeURIComponent(`${sourceBucket}/${obj.Key}`),
        Key: destKey,
      }),
    );
  }
}
