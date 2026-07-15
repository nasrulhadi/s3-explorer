import { useCallback, useRef } from "react";
import { Upload } from "@aws-sdk/lib-storage";
import { createS3Client } from "../lib/s3Client";
import { useConnectionStore } from "../store/connectionStore";
import { useTransferStore } from "../store/transferStore";
import type { Transfer } from "../types";

// ─── Hook ───────────────────────────────────────────────────

/**
 * `useUpload` — manages file uploads with real-time progress tracking
 * via the Zustand `transferStore`, using `@aws-sdk/lib-storage`'s `Upload`
 * class (multipart under the hood) so progress events and cancellation
 * are available — unlike a bare `PutObjectCommand` which is a single
 * fire-and-forget request with no progress feedback.
 *
 * Usage:
 * ```ts
 * const { startUpload, cancelUpload } = useUpload();
 * const transferId = "upload-123";
 * await startUpload(transferId, connectionId, bucket, key, file);
 * // later:
 * cancelUpload(transferId);
 * ```
 */
export function useUpload() {
  /** Active Upload instances keyed by transfer ID — used for cancellation */
  const uploads = useRef<Map<string, Upload>>(new Map());

  const startUpload = useCallback(
    async (
      transferId: string,
      connectionId: string,
      bucket: string,
      key: string,
      file: File,
    ): Promise<void> => {
      const connection = useConnectionStore
        .getState()
        .connections.find((c) => c.id === connectionId);

      if (!connection) {
        throw new Error(`Connection "${connectionId}" not found.`);
      }

      const client = createS3Client(connection);

      const upload = new Upload({
        client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: file,
          ContentType: file.type || "application/octet-stream",
        },
        // Keep parts small enough that even modest files report progress
        // more than once, without generating excessive requests for huge ones.
        partSize: 8 * 1024 * 1024, // 8 MB
        queueSize: 4,
      });

      uploads.current.set(transferId, upload);

      upload.on("httpUploadProgress", (progress) => {
        if (typeof progress.loaded === "number") {
          useTransferStore.getState().updateTransfer(transferId, {
            transferredBytes: progress.loaded,
          });
        }
      });

      try {
        await upload.done();
        useTransferStore.getState().updateTransfer(transferId, {
          status: "done",
          transferredBytes: file.size,
        });
      } catch (err) {
        const name = (err as Error).name;
        if (name === "AbortError") {
          useTransferStore.getState().updateTransfer(transferId, {
            status: "error",
            error: "Cancelled by user",
          });
        } else {
          useTransferStore.getState().updateTransfer(transferId, {
            status: "error",
            error: (err as Error).message,
          });
        }
      } finally {
        uploads.current.delete(transferId);
      }
    },
    [],
  );

  const cancelUpload = useCallback((transferId: string) => {
    const upload = uploads.current.get(transferId);
    if (upload) {
      void upload.abort();
    }
  }, []);

  const isUploading = useCallback(
    (transferId: string) => uploads.current.has(transferId),
    [],
  );

  return { startUpload, cancelUpload, isUploading };
}

// Re-export for consumers that just need the transfer shape
export type { Transfer };
