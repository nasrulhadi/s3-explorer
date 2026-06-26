import { useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { useTransferStore } from "../../../store/transferStore";
import { useConnectionStore } from "../../../store/connectionStore";
import { createS3Client } from "../../../lib/s3Client";
import { moveFolderRecursive } from "../../../lib/s3FolderOps";
import { useS3 } from "../../../hooks/useS3";
import type { S3Item } from "../../../types";

const DRAG_THRESHOLD = 10;

interface DragState {
  active: boolean;
  sourceKeys: string[];
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Custom mouse-based drag & drop hook (bypasses broken HTML5 DnD in Tauri WebView2).
 *
 * On drop: moves source items into a target folder via S3 CopyObject + delete,
 * creating TransferPanel entries for progress feedback.
 */
export function useDragMove(
  connectionId: string | null,
  bucket: string | null,
  prefix: string,
  displayedItems: S3Item[],
  selectedKeys: Set<string>,
  clearSelection: () => void,
) {
  const { deleteItem } = useS3();
  const connections = useConnectionStore((s) => s.connections);
  const queryClient = useQueryClient();

  const getConnection = useCallback(
    (id: string) => connections.find((c) => c.id === id)!,
    [connections],
  );

  const dragRef = useRef<DragState>({
    active: false,
    sourceKeys: [],
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [movingKeys, setMovingKeys] = useState<Set<string>>(new Set());

  const resetDrag = useCallback(() => {
    const d = dragRef.current;
    d.active = false;
    d.sourceKeys = [];
    d.startX = 0;
    d.startY = 0;
    setDragOverKey(null);
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
  }, []);

  const findDropTarget = useCallback(
    (clientX: number, clientY: number): S3Item | null => {
      const ghost = dragGhostRef.current;
      if (ghost) ghost.style.display = "none";
      const el = document.elementFromPoint(clientX, clientY);
      if (ghost) ghost.style.display = "";

      if (!el) return null;
      let current: Element | null = el;
      while (current) {
        const key = current.getAttribute("data-item-key");
        if (key) {
          return displayedItems.find((i) => i.key === key && i.type === "folder") ?? null;
        }
        current = current.parentElement;
      }
      return null;
    },
    [displayedItems],
  );

  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const d = dragRef.current;

      if (!d.active) {
        if (d.sourceKeys.length === 0) return;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

        d.active = true;
        d.currentX = e.clientX;
        d.currentY = e.clientY;

        const count = d.sourceKeys.length;
        const firstItem = displayedItems.find((it) => it.key === d.sourceKeys[0]);
        const label = count === 1
          ? firstItem?.name ?? ""
          : `${count} items`;

        const ghost = document.createElement("div");
        ghost.className =
          "fixed z-[9999] pointer-events-none px-2 py-1 rounded text-xs font-medium bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)] shadow-lg whitespace-nowrap";
        ghost.textContent = label;
        ghost.style.left = `${e.clientX + 12}px`;
        ghost.style.top = `${e.clientY - 10}px`;
        document.body.appendChild(ghost);
        dragGhostRef.current = ghost;
        return;
      }

      d.currentX = e.clientX;
      d.currentY = e.clientY;

      const ghost = dragGhostRef.current;
      if (ghost) {
        ghost.style.left = `${e.clientX + 12}px`;
        ghost.style.top = `${e.clientY - 10}px`;
      }

      const target = findDropTarget(e.clientX, e.clientY);
      setDragOverKey(target ? target.key : null);
    },
    [findDropTarget, displayedItems],
  );

  const setDragSource = useCallback((items: S3Item[], item: S3Item) => {
    const d = dragRef.current;
    if (selectedKeys.size > 1 && selectedKeys.has(item.key)) {
      d.sourceKeys = [...selectedKeys];
    } else {
      d.sourceKeys = [item.key];
    }
    d.active = false;
  }, [selectedKeys]);

  const handleContainerMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const d = dragRef.current;

      const wasActive = d.active;
      const sourceKeys = [...d.sourceKeys];
      d.active = false;
      d.sourceKeys = [];
      d.startX = 0;
      d.startY = 0;
      setDragOverKey(null);

      if (dragGhostRef.current) {
        dragGhostRef.current.remove();
        dragGhostRef.current = null;
      }

      if (!wasActive || sourceKeys.length === 0) return;

      const target = findDropTarget(e.clientX, e.clientY);
      if (!target) return;

      if (sourceKeys.includes(target.key)) return;

      for (const sk of sourceKeys) {
        if (sk.endsWith("/") && target.key.startsWith(sk)) return;
      }

      if (!connectionId || !bucket) return;

      const conn = getConnection(connectionId);
      if (!conn) return;
      const client = createS3Client(conn);
      const destPrefix = target.key;

      const now = Date.now();
      const transferIds: string[] = [];
      for (const sk of sourceKeys) {
        const item = displayedItems.find((it) => it.key === sk);
        const name = item?.name ?? sk.split("/").filter(Boolean).pop() ?? sk;
        const id = `move-${now}-${sk.replace(/[^a-zA-Z0-9]/g, "-").slice(-20)}`;
        transferIds.push(id);
        useTransferStore.getState().addTransfer({
          id,
          type: "move",
          fileName: name,
          totalBytes: 0,
          transferredBytes: 0,
          status: "active",
          key: sk,
          bucket,
          connectionId,
        });
      }
      setMovingKeys(new Set(sourceKeys));
      clearSelection();

      (async () => {
        for (let i = 0; i < sourceKeys.length; i++) {
          const sourceKey = sourceKeys[i];
          const tid = transferIds[i];
          try {
            if (sourceKey.endsWith("/")) {
              const folderName = sourceKey.slice(0, -1).split("/").pop()!;
              await moveFolderRecursive(client, bucket, sourceKey, `${destPrefix}${folderName}/`, conn.provider);
            } else {
              const item = displayedItems.find((it) => it.key === sourceKey);
              if (!item) continue;
              const destKeyFull = `${destPrefix}${item.name}`;
              await client.send(
                new CopyObjectCommand({
                  Bucket: bucket,
                  CopySource: encodeURIComponent(`${bucket}/${item.key}`),
                  Key: destKeyFull,
                }),
              );
              await deleteItem.mutateAsync({ connectionId, bucket, key: item.key });
            }
            useTransferStore.getState().updateTransfer(tid, { status: "done" });
          } catch (_) {
            useTransferStore.getState().updateTransfer(tid, { status: "error", error: "Move failed" });
          }
        }

        queryClient.invalidateQueries({
          queryKey: ["s3", "objects", connectionId, bucket, prefix],
        });
      })();
    },
    [connectionId, bucket, displayedItems, getConnection, queryClient, prefix, findDropTarget, clearSelection],
  );

  const onMouseLeave = useCallback(() => {
    const d = dragRef.current;
    d.active = false;
    d.sourceKeys = [];
    d.startX = 0;
    d.startY = 0;
    setDragOverKey(null);
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
  }, []);

  return {
    dragRef,
    dragGhostRef,
    dragOverKey,
    movingKeys,
    handleContainerMouseMove,
    handleContainerMouseUp,
    onMouseLeave,
    setDragSource,
    resetDrag,
    setMovingKeys,
    setDragOverKey,
  };
}
