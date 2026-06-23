import { useCallback, useRef } from "react";
import {
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { createS3Client } from "../lib/s3Client";
import { useConnectionStore } from "../store/connectionStore";
import { useTransferStore } from "../store/transferStore";
import type { Transfer } from "../types";

/** Files larger than this use the Tauri (Rust) download path */
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10 MB

// ─── Helper ─────────────────────────────────────────────────

function generateTransferId(): string {
  return crypto.randomUUID?.() ?? `dl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Extract the file name from the end of an S3 key */
function nameFromKey(key: string): string {
  const trimmed = key.endsWith("/") ? key.slice(0, -1) : key;
  const idx = trimmed.lastIndexOf("/");
  return idx === -1 ? trimmed : trimmed.slice(idx + 1);
}

// ─── Hook ───────────────────────────────────────────────────

/**
 * `useDownload` — manages file downloads with real-time progress
 * tracking via the Zustand `transferStore`.
 *
 * - Files < 10 MB: browser `fetch` with `ReadableStream` (progress per chunk)
 * - Files ≥ 10 MB: Tauri Rust command (TODO — falls back to JS path for now)
 *
 * Usage:
 * ```ts
 * const { startDownload, cancelDownload } = useDownload();
 * const transferId = await startDownload(connectionId, bucket, key);
 * // later:
 * cancelDownload(transferId);
 * ```
 */
export function useDownload() {
  /** Active AbortControllers keyed by transfer ID — used for cancellation */
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // ── startDownload ──────────────────────────────────────────

  const startDownload = useCallback(
    async (connectionId: string, bucket: string, key: string): Promise<string> => {
      const connection = useConnectionStore
        .getState()
        .connections.find((c) => c.id === connectionId);

      if (!connection) {
        throw new Error(`Connection "${connectionId}" not found.`);
      }

      const client = createS3Client(connection);
      const fileName = nameFromKey(key);
      const transferId = generateTransferId();
      const abortController = new AbortController();
      abortControllers.current.set(transferId, abortController);

      // 1. Get file size via HeadObject
      let totalBytes = 0;
      try {
        const head = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        totalBytes = head.ContentLength ?? 0;
      } catch {
        // If HeadObject fails, proceed with unknown size (progress bar becomes indeterminate)
      }

      // 2. Register transfer in store
      const transfer: Transfer = {
        id: transferId,
        type: "download",
        fileName,
        totalBytes,
        transferredBytes: 0,
        status: "active",
        key,
        bucket,
        connectionId,
      };
      useTransferStore.getState().addTransfer(transfer);

      // 3. Large-file path (Tauri Rust command) — not yet implemented
      if (totalBytes > LARGE_FILE_THRESHOLD) {
        // TODO: replace with Tauri invoke
        // try {
        //   await invoke("download_file", {
        //     connectionId, bucket, key, transferId, savePath,
        //   });
        // } catch (err) { ... }
      }

      // 4. JS download path (all sizes for now)
      try {
        const url = await getSignedUrl(
          client,
          new GetObjectCommand({ Bucket: bucket, Key: key }),
          { expiresIn: 3600 },
        );

        const response = await tauriFetch(url, {
          method: "GET",
          // Tauri's fetch doesn't support AbortController signal the same way,
          // but we keep the reference for the cancel logic below.
        } as RequestInit & { signal?: AbortSignal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();

        if (!reader) {
          // No streaming support — fall back to plain blob download
          const blob = await response.blob();
          triggerBrowserDownload(blob, fileName);
        } else {
          // Read stream chunk-by-chunk and update store progress
          const chunks: Uint8Array[] = [];
          let transferred = 0;

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            transferred += value.byteLength;

            useTransferStore.getState().updateTransfer(transferId, {
              transferredBytes: transferred,
            });
          }

          const blob = new Blob(chunks as BlobPart[]);
          triggerBrowserDownload(blob, fileName);
        }

        // Mark transfer as done
        useTransferStore.getState().updateTransfer(transferId, {
          status: "done",
          transferredBytes: totalBytes || transfer.transferredBytes,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
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
        abortControllers.current.delete(transferId);
      }

      return transferId;
    },
    [],
  );

  // ── cancelDownload ─────────────────────────────────────────

  const cancelDownload = useCallback((transferId: string) => {
    const controller = abortControllers.current.get(transferId);
    if (controller) {
      controller.abort();
    }
  }, []);

  return { startDownload, cancelDownload };
}

// ─── Internal: trigger browser save dialog ──────────────────

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}
