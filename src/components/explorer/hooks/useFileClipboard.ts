import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { useClipboardStore } from "../../../store/clipboardStore";
import { useConnectionStore } from "../../../store/connectionStore";
import { createS3Client } from "../../../lib/s3Client";
import { copyFolderRecursive } from "../../../lib/s3FolderOps";
import type { S3Item } from "../../../types";

/**
 * Clipboard copy/paste hook for the file explorer.
 *
 * Orchestrates clipboard operations — copy selected items into
 * the Zustand clipboard store, and paste them via S3 CopyObject
 * (with recursive folder support).
 */
export function useFileClipboard(
  connectionId: string | null,
  bucket: string | null,
  prefix: string,
  displayedItems: S3Item[],
  selectedKeys: Set<string>,
) {
  const clipboard = useClipboardStore();
  const connections = useConnectionStore((s) => s.connections);
  const queryClient = useQueryClient();

  const getConnection = useCallback(
    (id: string) => connections.find((c) => c.id === id)!,
    [connections],
  );

  const handleCopy = useCallback(() => {
    if (selectedKeys.size === 0) return;
    const items = displayedItems
      .filter((i) => selectedKeys.has(i.key))
      .map((i) => ({ key: i.key, name: i.name, type: i.type as "file" | "folder" }));
    clipboard.copy(items, bucket!, prefix);
  }, [selectedKeys, displayedItems, clipboard, bucket, prefix]);

  const handlePaste = useCallback(async () => {
    if (clipboard.items.length === 0) {
      return;
    }
    if (!connectionId || !bucket) return;

    const client = createS3Client(getConnection(connectionId));
    let successCount = 0;

    const existingNames = new Set(displayedItems.map((i) => i.name));

    for (const item of clipboard.items) {
      try {
        let destName = item.name;
        let counter = 1;
        const isFolder = item.key.endsWith("/");
        while (existingNames.has(destName)) {
          if (isFolder) {
            destName = `${item.name}-copy${counter}`;
          } else {
            const extIndex = item.name.lastIndexOf(".");
            if (extIndex > 0) {
              const base = item.name.slice(0, extIndex);
              const ext = item.name.slice(extIndex);
              destName = `${base}-copy${counter}${ext}`;
            } else {
              destName = `${item.name}-copy${counter}`;
            }
          }
          counter++;
        }
        existingNames.add(destName);

        const destPrefix = `${prefix}${destName}${isFolder ? "/" : ""}`;

        if (isFolder) {
          const sourcePrefix = item.key;
          await copyFolderRecursive(client, clipboard.sourceBucket!, sourcePrefix, bucket, destPrefix);
          successCount++;
        } else {
          await client.send(
            new CopyObjectCommand({
              Bucket: bucket,
              CopySource: encodeURIComponent(`${clipboard.sourceBucket}/${item.key}`),
              Key: destPrefix,
            }),
          );
          successCount++;
        }
      } catch (_) {
        // Paste failed silently
      }
    }

    if (successCount > 0) {
      queryClient.invalidateQueries({
        queryKey: ["s3", "objects", connectionId, bucket, prefix],
      });
    }
  }, [clipboard, connectionId, bucket, prefix, displayedItems, getConnection, queryClient]);

  return { handleCopy, handlePaste, clipboard };
}
