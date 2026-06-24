import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as ContextMenu from "@radix-ui/react-context-menu";
import JSZip from "jszip";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  FileX,
  AlertCircle,
  Circle,
  Check,
  Copy,
  ClipboardPaste,
  Upload,
  FolderPlus,
  RefreshCw,
  Pencil,
  Trash2,
  Download,
  Link,
  Info,
  Archive,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CopyObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useS3 } from "../../hooks/useS3";
import { useConnectivity } from "../../hooks/useConnectivity";
import { useNavigationStore } from "../../store/navigationStore";
import { useTransferStore } from "../../store/transferStore";
import { useClipboardStore } from "../../store/clipboardStore";
import { createS3Client } from "../../lib/s3Client";
import { useConnectionStore } from "../../store/connectionStore";
import { formatFileSize } from "../../lib/utils";
import type { S3Item, SortField, SortDirection } from "../../types";
import FileRow, { ROW_HEIGHT, ROW_GRID } from "./FileRow";
import FolderRow from "./FolderRow";
import UploadModal from "./UploadModal";

// ─── Shared menu styling ────────────────────────────────────

const MENU_CONTENT =
  "min-w-[180px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-50";
const MENU_ITEM =
  "flex items-center gap-2.5 px-2.5 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-md outline-none cursor-default select-none data-[highlighted]:bg-[var(--s3-accent-base)] data-[highlighted]:text-[var(--s3-accent-text)] data-[disabled]:opacity-40 data-[disabled]:pointer-events-none";
const MENU_SEPARATOR = "h-px bg-gray-200 dark:bg-gray-700 my-1";
const MENU_SHORTCUT = "ml-auto text-xs text-gray-400 dark:text-gray-500";

// ─── Skeleton row (loading placeholder) ─────────────────────

function SkeletonRow() {
  return (
    <div className={`${ROW_GRID} min-h-10 px-3 gap-2 items-center border-b border-[var(--s3-window-border)]`}>
      <div className="h-4 w-4 rounded bg-[var(--s3-window-border)] animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-[var(--s3-window-border)] animate-pulse" />
      <div className="h-4 w-12 rounded bg-[var(--s3-window-hover-bg)] animate-pulse justify-self-end" />
      <div className="h-4 w-20 rounded bg-[var(--s3-window-hover-bg)] animate-pulse justify-self-end" />
      <div className="h-4 w-14 rounded bg-[var(--s3-window-hover-bg)] animate-pulse justify-self-end" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface FileListProps {
  /** Text filter applied to item names */
  filterQuery: string;
  /** Upload modal open state */
  uploadOpen: boolean;
  /** Close upload modal */
  onUploadClose: () => void;
  /** Open upload modal (from toolbar or right-click) */
  onUploadOpen: () => void;
  /** New folder modal open state */
  newFolderOpen: boolean;
  /** Close new folder modal */
  onNewFolderClose: () => void;
  /** Open new folder modal */
  onNewFolderOpen: () => void;
}

export default function FileList({ filterQuery, uploadOpen, onUploadClose, onUploadOpen, newFolderOpen, onNewFolderClose, onNewFolderOpen }: FileListProps) {
  const {
    listObjects,
    downloadFile,
    getPresignedUrl,
    renameItem,
    deleteItem,
    headObject,
  } = useS3();

  // Navigation state from Zustand
  const connectionId = useNavigationStore((s) => s.connectionId);
  const bucket = useNavigationStore((s) => s.bucket);
  const prefix = useNavigationStore((s) => s.prefix);
  const setPrefix = useNavigationStore((s) => s.setPrefix);

  // Local UI state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const [contextTarget, setContextTarget] = useState<{ type: "item" | "empty"; item?: S3Item }>({ type: "empty" });
  const [deleteTarget, setDeleteTarget] = useState<S3Item | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<S3Item[] | null>(null);
  const [renameTarget, setRenameTarget] = useState<S3Item | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [dropFiles, setDropFiles] = useState<Array<{ file: File; relativePath: string; size: number }> | undefined>(undefined);
  const [infoData, setInfoData] = useState<{ title: string; type: string; rows: { label: string; value: string }[] } | null>(null);
  const [urlData, setUrlData] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const skeletonCountRef = useRef(8);

  // ── Internet connectivity tracking ─────────────────────────
  const isOnline = useConnectivity();

  // ── Clipboard state ────────────────────────────────────────
  const clipboard = useClipboardStore();
  const connections = useConnectionStore((s) => s.connections);
  const queryClient = useQueryClient();
  const getConnection = useCallback(
    (id: string) => connections.find((c) => c.id === id)!,
    [connections],
  );

  // ── Data query ─────────────────────────────────────────────
  const { data, isLoading, isFetching, isError, error } = listObjects(
    connectionId,
    bucket,
    prefix,
  );

  // ── Active transfers tracking ──────────────────────────────
  const transfers = useTransferStore((s) => s.transfers);
  const activeTransfers = useMemo(
    () => transfers.filter((t) => t.status === "active"),
    [transfers],
  );
  const hasActiveTransfers = activeTransfers.length > 0;

  // ── Activity state ─────────────────────────────────────────
  const isActivity = isLoading || isFetching || hasActiveTransfers;
  const activityTooltip = !isOnline
    ? "No internet connection"
    : isLoading || isFetching
    ? "Loading folder..."
    : hasActiveTransfers
    ? `${activeTransfers.length} transfer${activeTransfers.length > 1 ? "s" : ""} in progress`
    : "No activity";

    // Reset selection + context when navigating or after data refresh
  useEffect(() => {
    setSelectedKeys(new Set());
    setContextTarget({ type: "empty" });
    setFocusIndex(-1);
  }, [connectionId, bucket, prefix, data]);

  // ── Sort toggle ────────────────────────────────────────────
  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  // ── Filter + sort pipeline ─────────────────────────────────
  const displayedItems = useMemo(() => {
    const items = data?.items ?? [];

    // 1. Filter by search query (case-insensitive name match)
    const filtered = filterQuery
      ? items.filter((i) =>
          i.name.toLowerCase().includes(filterQuery.toLowerCase()),
        )
      : items;

    // 2. Sort — folders always come first
    return [...filtered].sort((a, b) => {
      // Folders first (unless sorting by size, where folders have none)
      if (a.type !== b.type) {
        if (a.type === "folder") return -1;
        if (b.type === "folder") return 1;
      }

      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "size":
          cmp = (a.size ?? 0) - (b.size ?? 0);
          break;
        case "lastModified":
          cmp =
            (a.lastModified?.getTime() ?? 0) -
            (b.lastModified?.getTime() ?? 0);
          break;
        case "storageClass":
          cmp = (a.storageClass ?? "").localeCompare(b.storageClass ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, filterQuery, sortField, sortDir]);

  // Track last known item count for skeleton during reload
  useEffect(() => {
    if (displayedItems.length > 0) {
      skeletonCountRef.current = displayedItems.length;
    }
  }, [displayedItems]);

  // ── TanStack Virtual ───────────────────────────────────────
  const virtualizer = useVirtualizer({
    count: displayedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  // ── Selection handlers ─────────────────────────────────────
  const toggleSelect = useCallback((item: S3Item) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(item.key)) next.delete(item.key);
      else next.add(item.key);
      return next;
    });
  }, []);

  // Navigate into a folder (double-click on FolderRow)
  const openFolder = useCallback(
    (item: S3Item) => {
      setPrefix(item.key);
    },
    [setPrefix],
  );

  // Open item — folders: navigate in; files: no-op for now
  const openItem = useCallback(
    (item: S3Item) => {
      if (item.type === "folder") openFolder(item);
    },
    [openFolder],
  );

  // ── Keyboard navigation ────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (displayedItems.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((i) => Math.min(i + 1, displayedItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < displayedItems.length) {
            openItem(displayedItems[focusIndex]);
          }
          break;
      }
    },
    [displayedItems, focusIndex, openItem],
  );

  // ── Clipboard: Copy selected items ────────────────────────
  const handleCopy = useCallback(() => {
    if (selectedKeys.size === 0) return;
    const items = displayedItems
      .filter((i) => selectedKeys.has(i.key))
      .map((i) => ({ key: i.key, name: i.name, type: i.type as "file" | "folder" }));
    clipboard.copy(items, bucket!, prefix);
  }, [selectedKeys, displayedItems, clipboard, bucket, prefix]);

  // ── Clipboard: Paste items ────────────────────────────────
  const handlePaste = useCallback(async () => {
    if (clipboard.items.length === 0) {
      return;
    }
    if (!connectionId || !bucket) return;

    const client = createS3Client(getConnection(connectionId));
    let successCount = 0;

    // Build set of existing names for duplicate detection
    const existingNames = new Set(displayedItems.map((i) => i.name));

    for (const item of clipboard.items) {
      try {
        // Generate unique destination name if duplicate
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
          // ── Folder: list all objects under prefix & copy each ──
          const sourcePrefix = item.key;
          const sourceClient = createS3Client(getConnection(connectionId));
          const listed = await sourceClient.send(
            new ListObjectsV2Command({
              Bucket: clipboard.sourceBucket!,
              Prefix: sourcePrefix,
            }),
          );

          const objects = listed.Contents ?? [];
          for (const obj of objects) {
            if (!obj.Key) continue;
            // Replace source prefix with dest prefix
            const suffix = obj.Key.slice(sourcePrefix.length);
            const destObjKey = `${destPrefix}${suffix}`;
            await client.send(
              new CopyObjectCommand({
                Bucket: bucket,
                CopySource: encodeURIComponent(`${clipboard.sourceBucket}/${obj.Key}`),
                Key: destObjKey,
              }),
            );
          }
          successCount++;
        } else {
          // ── File: single CopyObject ──
          await client.send(
            new CopyObjectCommand({
              Bucket: bucket,
              CopySource: encodeURIComponent(`${clipboard.sourceBucket}/${item.key}`),
              Key: destPrefix,
            }),
          );
          successCount++;
        }
      } catch (err) {
        // Paste failed silently
      }
    }

    if (successCount > 0) {
      queryClient.invalidateQueries({
        queryKey: ["s3", "objects", connectionId, bucket, prefix],
      });
    }
  }, [clipboard, connectionId, bucket, prefix, displayedItems, getConnection, queryClient]);

  // ── Delete folder + all contents recursively ──────────────
  const deleteFolderRecursive = useCallback(async (folderKey: string) => {
    if (!connectionId || !bucket) return;
    const client = createS3Client(getConnection(connectionId));

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
  }, [connectionId, bucket, getConnection]);

  // ── New Folder ────────────────────────────────────────────
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderCreating, setNewFolderCreating] = useState(false);

  // Reset name setiap kali modal terbuka (dari toolbar atau klik kanan)
  useEffect(() => {
    if (newFolderOpen) {
      setNewFolderName("");
    }
  }, [newFolderOpen]);

  const handleNewFolder = useCallback(() => {
    if (!connectionId || !bucket) return;
    setNewFolderName("");
    onNewFolderOpen();
  }, [connectionId, bucket, onNewFolderOpen]);

  const confirmNewFolder = useCallback(async () => {
    if (!connectionId || !bucket || !newFolderName.trim()) return;

    setNewFolderCreating(true);
    try {
      const client = createS3Client(getConnection(connectionId));
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `${prefix}${newFolderName.trim()}/`,
          Body: "",
        }),
      );
      onNewFolderClose();
      queryClient.invalidateQueries({
        queryKey: ["s3", "objects", connectionId, bucket, prefix],
      });
    } catch (err) {
      // Silently fail - no notification needed
    } finally {
      setNewFolderCreating(false);
    }
  }, [connectionId, bucket, prefix, newFolderName, getConnection, queryClient, onNewFolderClose]);

  // ── Refresh ───────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    if (!connectionId || !bucket) return;
    queryClient.invalidateQueries({
      queryKey: ["s3", "objects", connectionId, bucket, prefix],
    });
  }, [queryClient, connectionId, bucket, prefix]);

  // ── Upload ────────────────────────────────────────────────
  const handleUpload = useCallback(() => {
    onUploadOpen();
  }, [onUploadOpen]);

  const handleUploadComplete = useCallback(() => {
    if (connectionId && bucket) {
      queryClient.invalidateQueries({
        queryKey: ["s3", "objects", connectionId, bucket, prefix],
      });
    }
  }, [connectionId, bucket, prefix, queryClient]);

  // ── Rename ────────────────────────────────────────────────
  const handleRename = useCallback((item: S3Item) => {
    setRenameError(null);
    setRenameName(item.name);
    setRenameTarget(item);
  }, []);

  const confirmRename = useCallback(async () => {
    if (!connectionId || !bucket || !renameTarget || !renameName.trim()) return;
    if (renameName.trim() === renameTarget.name) {
      setRenameTarget(null);
      return;
    }

    setRenameLoading(true);
    setRenameError(null);

    // For folders, check if it's a real object first
    if (renameTarget.type === "folder") {
      try {
        await headObject.mutateAsync({ connectionId, bucket, key: renameTarget.key });
      } catch (_) {
        setRenameError("This folder can't be renamed — it might be a virtual folder. Use New Folder to create a real folder first.");
        setRenameLoading(false);
        return;
      }
    }
    // Strip trailing slash for folder keys, then rebuild path prefix
    const baseKey = renameTarget.key.endsWith("/") ? renameTarget.key.slice(0, -1) : renameTarget.key;
    const lastSlash = baseKey.lastIndexOf("/");
    const newKeyBase = lastSlash === -1 ? renameName.trim() : baseKey.slice(0, lastSlash + 1) + renameName.trim();
    const newKey = renameTarget.key.endsWith("/") ? newKeyBase + "/" : newKeyBase;

    try {
      await renameItem
        .mutateAsync({ connectionId, bucket, oldKey: renameTarget.key, newKey });
      setRenameTarget(null);
      queryClient.invalidateQueries({
        queryKey: ["s3", "objects", connectionId, bucket, prefix],
      });
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setRenameLoading(false);
    }
  }, [connectionId, bucket, renameTarget, renameName, renameItem, queryClient, prefix]);

  // ── Delete (opens modal) ──────────────────────────────────
  const handleDelete = useCallback((item: S3Item) => {
    setDeleteTarget(item);
  }, []);

  // ── Bulk delete (multi-select) ─────────────────────────────
  const handleBulkDelete = useCallback(async (items: S3Item[]) => {
    if (!connectionId || !bucket || items.length === 0) return;

    for (const item of items) {
      if (item.type === "folder") {
        await deleteFolderRecursive(item.key);
      } else {
        await deleteItem.mutateAsync({ connectionId, bucket, key: item.key });
      }
    }

    setSelectedKeys(new Set());
    setContextTarget({ type: "empty" });
    queryClient.invalidateQueries({
      queryKey: ["s3", "objects", connectionId, bucket, prefix],
    });
  }, [connectionId, bucket, deleteItem, deleteFolderRecursive, queryClient, prefix]);

  // ── Download ──────────────────────────────────────────────
  const handleDownloadItem = useCallback((item: S3Item) => {
    if (!connectionId || !bucket) return;
    downloadFile.mutateAsync({ connectionId, bucket, key: item.key });
  }, [connectionId, bucket, downloadFile]);

  // ── Download as ZIP ─────────────────────────────────────
  const ZIP_LIMIT_FILES = 250;
  const ZIP_LIMIT_BYTES = 500 * 1024 * 1024;

  const handleDownloadZip = useCallback(async (items: S3Item[]) => {
    if (!connectionId || !bucket) return;
    setZipError(null);

    // Collect all file-level objects (expand folders)
    const allItems: { key: string; name: string; size: number }[] = [];

    for (const item of items) {
      if (item.type === "folder" && item.key.endsWith("/")) {
        // List objects under folder prefix
        const client = createS3Client(getConnection(connectionId));
        const listed = await client.send(
          new ListObjectsV2Command({ Bucket: bucket, Prefix: item.key }),
        );
        for (const obj of listed.Contents ?? []) {
          if (!obj.Key || obj.Key === item.key) continue; // skip folder placeholder
          allItems.push({
            key: obj.Key,
            name: obj.Key.slice(item.key.length), // relative path
            size: obj.Size ?? 0,
          });
        }
      } else {
        allItems.push({ key: item.key, name: item.name, size: item.size ?? 0 });
      }
    }

    // Validate limits
    const totalSize = allItems.reduce((s, i) => s + i.size, 0);
    if (allItems.length > ZIP_LIMIT_FILES || totalSize > ZIP_LIMIT_BYTES) {
      setZipError(
        `Download as ZIP is limited to ${ZIP_LIMIT_FILES} files or ${(ZIP_LIMIT_BYTES / 1024 / 1024).toFixed(0)} MB total. ` +
        `Selected: ${allItems.length} file${allItems.length > 1 ? "s" : ""}, ${(totalSize / 1024 / 1024).toFixed(1)} MB.`
      );
      return;
    }

    // Create transfer entry
    const transferId = `zip-${Date.now()}`;
    useTransferStore.getState().addTransfer({
      id: transferId,
      type: "download",
      fileName: `${items.length === 1 ? items[0].name : "files"}.zip`,
      totalBytes: totalSize,
      transferredBytes: 0,
      status: "active",
      bucket,
      connectionId,
    });

    // Download each file and add to zip
    const zip = new JSZip();
    let downloaded = 0;

    for (const entry of allItems) {
      try {
        const conn = getConnection(connectionId);
        if (!conn) continue;
        const client = createS3Client(conn);
        const signedUrl = client.config.endpoint
          ? await getSignedUrl(client as never, new GetObjectCommand({ Bucket: bucket, Key: entry.key }), { expiresIn: 300 })
          : await getSignedUrl(client as never, new GetObjectCommand({ Bucket: bucket, Key: entry.key }), { expiresIn: 300 });

        const response = await tauriFetch(signedUrl);
        if (!response.ok) continue;

        const blob = await response.blob();
        zip.file(entry.name, blob);
        downloaded += entry.size;
        useTransferStore.getState().updateTransfer(transferId, { transferredBytes: downloaded });
      } catch (_) {
        // Skip failed files
      }
    }

    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const blobUrl = URL.createObjectURL(zipBlob);

    // Try showSaveFilePicker
    try {
      const handle = await (window as any).showSaveFilePicker?.({
        suggestedName: `${items.length === 1 ? items[0].name : "files"}.zip`,
      });
      if (handle) {
        const writable = await handle.createWritable();
        await writable.write(zipBlob);
        await writable.close();
        URL.revokeObjectURL(blobUrl);
        useTransferStore.getState().updateTransfer(transferId, {
          status: "done",
          transferredBytes: totalSize,
        });
        return;
      }
    } catch {
      // Fallback
    }

    // Fallback: anchor click
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = `${items.length === 1 ? items[0].name : "files"}.zip`;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    }, 5000);

    useTransferStore.getState().updateTransfer(transferId, {
      status: "done",
      transferredBytes: totalSize,
    });
  }, [connectionId, bucket, getConnection, queryClient]);

  // ── Get URL (presigned) ───────────────────────────────────
  const handleGetUrl = useCallback((item: S3Item) => {
    if (!connectionId || !bucket) return;
    getPresignedUrl
      .mutateAsync({ connectionId, bucket, key: item.key })
      .then(async (url) => {
        await navigator.clipboard.writeText(url);
        setUrlData(url);
      });
  }, [connectionId, bucket, getPresignedUrl]);

  // ── Get Info ──────────────────────────────────────────────
  const handleGetInfo = useCallback((item: S3Item) => {
    if (!connectionId || !bucket) return;
    headObject
      .mutateAsync({ connectionId, bucket, key: item.key })
      .then((meta) => {
        const rows: { label: string; value: string }[] = [
          { label: "Name", value: item.name },
          { label: "Key", value: item.key },
          { label: "Type", value: item.type === "folder" ? "Folder" : "File" },
        ];
        if (meta.size !== undefined) {
          rows.push({ label: "Size", value: formatFileSize(meta.size) });
        }
        if (meta.lastModified) {
          rows.push({ label: "Last Modified", value: meta.lastModified.toLocaleString() });
        }
        if (meta.contentType) {
          rows.push({ label: "Content Type", value: meta.contentType });
        }
        if (meta.storageClass) {
          rows.push({ label: "Storage Class", value: meta.storageClass });
        }
        if (meta.etag) {
          rows.push({ label: "ETag", value: meta.etag });
        }
        setInfoData({ title: item.name, type: item.type === "folder" ? "Folder" : "File", rows });
      });
  }, [connectionId, bucket, headObject]);

    // ── Unified context menu: determine what to show ──────────
  const menuItems = useMemo(() => {
    // Determine items to show actions for:
    // - If right-clicked on an item that IS selected → use full selection
    // - If right-clicked on an item that is NOT selected → use only that item
    // - If right-clicked on empty area → use current selection
    let items: S3Item[];
    if (contextTarget.type === "item" && contextTarget.item) {
      if (selectedKeys.has(contextTarget.item.key)) {
        items = displayedItems.filter((i) => selectedKeys.has(i.key));
      } else {
        items = [contextTarget.item];
      }
    } else {
      items = displayedItems.filter((i) => selectedKeys.has(i.key));
    }

    const count = items.length;
    const isSingle = count === 1;
    const hasFile = items.some((i) => i.type === "file");
    const hasFolder = items.some((i) => i.type === "folder");
    const isSingleFile = isSingle && items[0]?.type === "file";
    const isSingleFolder = isSingle && items[0]?.type === "folder";
    const isMixed = hasFile && hasFolder;

    return {
      isItem: contextTarget.type === "item" && count === 1,
      isItemMulti: contextTarget.type === "item" && count > 1,
      isSingleFile,
      isSingleFolder,
      isMixed,
      count,
      items,
    };
  }, [selectedKeys, displayedItems, contextTarget]);


  // ── Sort header helper ─────────────────────────────────────
  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-gray-300" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={13} className="text-[var(--s3-accent-text)]" />
    ) : (
      <ArrowDown size={13} className="text-[var(--s3-accent-text)]" />
    );
  }

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  // ── Loading (first load or refetch) ───────────────────────
  if (isLoading || isFetching) {
    return (
      <>
        <div className="h-full flex flex-col bg-[var(--s3-window-bg)] overflow-hidden">
          <ColumnHeader disabled />
          <div className="flex-1">
            {Array.from({ length: skeletonCountRef.current }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>
        <NewFolderModal
          open={newFolderOpen}
          name={newFolderName}
          creating={newFolderCreating}
          onNameChange={setNewFolderName}
          onConfirm={confirmNewFolder}
          onCancel={onNewFolderClose}
        />
        <DeleteConfirmModal
          open={deleteTarget !== null || bulkDeleteItems !== null}
          item={deleteTarget}
          bulkCount={bulkDeleteItems?.length ?? 0}
          onConfirm={async () => {
            if (deleteTarget) {
              const target = deleteTarget;
              if (!connectionId || !bucket || !target) return;
              try {
                if (target.type === "folder") {
                  await deleteFolderRecursive(target.key);
                } else {
                  await deleteItem.mutateAsync({ connectionId, bucket, key: target.key });
                }
                setDeleteTarget(null);
                setSelectedKeys(new Set());
                setContextTarget({ type: "empty" });
                queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
              } catch (_) {
                setDeleteTarget(null);
              }
            } else if (bulkDeleteItems) {
              handleBulkDelete(bulkDeleteItems);
              setBulkDeleteItems(null);
            }
          }}
          onCancel={() => { setDeleteTarget(null); setBulkDeleteItems(null); }}
        />
        <RenameModal
          open={renameTarget !== null}
          item={renameTarget}
          name={renameName}
          loading={renameLoading}
          error={renameError}
          onNameChange={setRenameName}
          onConfirm={confirmRename}
          onCancel={() => { setRenameError(null); setRenameTarget(null); }}
        />
        <UploadModal
          open={uploadOpen}
          connectionId={connectionId}
          bucket={bucket}
          prefix={prefix}
          getConnection={getConnection}
          dropFiles={dropFiles}
          onClose={() => { setDropFiles(undefined); onUploadClose(); }}
          onUploadComplete={handleUploadComplete}
        />
      </>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (isError) {
    return (
      <>
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[var(--s3-window-bg)]">
          <AlertCircle size={40} className="text-[var(--s3-danger)] mb-3" />
          <p className="text-sm font-medium text-[var(--s3-danger)]">
            Failed to load contents
          </p>
          <p className="text-xs text-[var(--s3-window-muted)] mt-1 max-w-xs">
            {(error as Error).message}
          </p>
        </div>
        <NewFolderModal
          open={newFolderOpen}
          name={newFolderName}
          creating={newFolderCreating}
          onNameChange={setNewFolderName}
          onConfirm={confirmNewFolder}
          onCancel={onNewFolderClose}
        />
        <DeleteConfirmModal
          open={deleteTarget !== null || bulkDeleteItems !== null}
          item={deleteTarget}
          bulkCount={bulkDeleteItems?.length ?? 0}
          onConfirm={async () => {
            if (deleteTarget) {
              const target = deleteTarget;
              if (!connectionId || !bucket || !target) return;
              try {
                if (target.type === "folder") {
                  await deleteFolderRecursive(target.key);
                } else {
                  await deleteItem.mutateAsync({ connectionId, bucket, key: target.key });
                }
                setDeleteTarget(null);
                setSelectedKeys(new Set());
                setContextTarget({ type: "empty" });
                queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
              } catch (_) {
                setDeleteTarget(null);
              }
            } else if (bulkDeleteItems) {
              handleBulkDelete(bulkDeleteItems);
              setBulkDeleteItems(null);
            }
          }}
          onCancel={() => { setDeleteTarget(null); setBulkDeleteItems(null); }}
        />
        <RenameModal
          open={renameTarget !== null}
          item={renameTarget}
          name={renameName}
          loading={renameLoading}
          error={renameError}
          onNameChange={setRenameName}
          onConfirm={confirmRename}
          onCancel={() => { setRenameError(null); setRenameTarget(null); }}
        />
        <UploadModal
          open={uploadOpen}
          connectionId={connectionId}
          bucket={bucket}
          prefix={prefix}
          getConnection={getConnection}
          dropFiles={dropFiles}
          onClose={() => { setDropFiles(undefined); onUploadClose(); }}
          onUploadComplete={handleUploadComplete}
        />
      </>
    );
  }

  // ── Empty state ────────────────────────────────────────────
  if (displayedItems.length === 0) {
    return (
      <>
        <ContextMenu.Root onOpenChange={(open) => {
          if (!open) setContextTarget({ type: "empty" });
        }}>
          <ContextMenu.Trigger asChild>
            <div className="h-full flex flex-col bg-[var(--s3-window-bg)] overflow-hidden">
              <ColumnHeader disabled />
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-[var(--s3-window-muted)]">
                {filterQuery ? (
                  <>
                    <FileX size={40} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium text-[var(--s3-window-muted)]">
                      No items match your filter
                    </p>
                    <p className="text-xs mt-1 opacity-70">
                      Try a different search term or clear the filter.
                    </p>
                  </>
                ) : (
                  <>
                    <FolderOpen size={40} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium text-[var(--s3-window-muted)]">
                      This folder is empty
                    </p>
                    <p className="text-xs mt-1 opacity-70">
                      Upload files or create a folder to get started.
                    </p>
                  </>
                )}
              </div>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content className={MENU_CONTENT}>
              <ContextMenu.Item
                className={MENU_ITEM}
                disabled={selectedKeys.size === 0}
                onSelect={handleCopy}
              >
                <Copy size={15} />
                Copy
                <span className={MENU_SHORTCUT}>{selectedKeys.size > 0 ? `${selectedKeys.size}` : ""}</span>
              </ContextMenu.Item>
              <ContextMenu.Item
                className={MENU_ITEM}
                disabled={clipboard.items.length === 0}
                onSelect={handlePaste}
              >
                <ClipboardPaste size={15} />
                Paste
              </ContextMenu.Item>
              <ContextMenu.Separator className={MENU_SEPARATOR} />
              <ContextMenu.Item className={MENU_ITEM} onSelect={handleUpload}>
                <Upload size={15} />
                Upload
                <span className={MENU_SHORTCUT}>Ctrl+U</span>
              </ContextMenu.Item>
              <ContextMenu.Item className={MENU_ITEM} onSelect={handleNewFolder}>
                <FolderPlus size={15} />
                New Folder
                <span className={MENU_SHORTCUT}>Ctrl+N</span>
              </ContextMenu.Item>
              <ContextMenu.Separator className={MENU_SEPARATOR} />
              <ContextMenu.Item className={MENU_ITEM} onSelect={handleRefresh}>
                <RefreshCw size={15} />
                Reload
                <span className={MENU_SHORTCUT}>F5</span>
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
        <NewFolderModal
          open={newFolderOpen}
          name={newFolderName}
          creating={newFolderCreating}
          onNameChange={setNewFolderName}
          onConfirm={confirmNewFolder}
          onCancel={onNewFolderClose}
        />
        <DeleteConfirmModal
          open={deleteTarget !== null || bulkDeleteItems !== null}
          item={deleteTarget}
          bulkCount={bulkDeleteItems?.length ?? 0}
          onConfirm={async () => {
            if (deleteTarget) {
              const target = deleteTarget;
              if (!connectionId || !bucket || !target) return;
              try {
                if (target.type === "folder") {
                  await deleteFolderRecursive(target.key);
                } else {
                  await deleteItem.mutateAsync({ connectionId, bucket, key: target.key });
                }
                setDeleteTarget(null);
                setSelectedKeys(new Set());
                setContextTarget({ type: "empty" });
                queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
              } catch (_) {
                setDeleteTarget(null);
              }
            } else if (bulkDeleteItems) {
              handleBulkDelete(bulkDeleteItems);
              setBulkDeleteItems(null);
            }
          }}
          onCancel={() => { setDeleteTarget(null); setBulkDeleteItems(null); }}
        />
        <RenameModal
          open={renameTarget !== null}
          item={renameTarget}
          name={renameName}
          loading={renameLoading}
          error={renameError}
          onNameChange={setRenameName}
          onConfirm={confirmRename}
          onCancel={() => { setRenameError(null); setRenameTarget(null); }}
        />
        <UploadModal
          open={uploadOpen}
          connectionId={connectionId}
          bucket={bucket}
          prefix={prefix}
          getConnection={getConnection}
          dropFiles={dropFiles}
          onClose={() => { setDropFiles(undefined); onUploadClose(); }}
          onUploadComplete={handleUploadComplete}
        />
      </>
    );
  }

  // ── Normal: virtualized list ───────────────────────────────
  return (
    <>
      <ContextMenu.Root onOpenChange={(open) => {
        if (!open) setContextTarget({ type: "empty" });
      }}>
        <div
          className="h-full flex flex-col bg-[var(--s3-window-bg)] overflow-hidden"
          onKeyDown={handleKeyDown}
          onContextMenu={(e) => e.preventDefault()}
          tabIndex={-1}
        >
          {/* ── Column header ────────────────────────────────── */}
          <ColumnHeader
            sortField={sortField}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            SortIcon={SortIcon}
          />

          {/* ── Virtual scroll container ─────────────────────── */}
          <ContextMenu.Trigger asChild>
            <div ref={parentRef} className="flex-1 overflow-auto outline-none">
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const item = displayedItems[virtualRow.index];
                  const isSelected = selectedKeys.has(item.key);
                  const isFocused = virtualRow.index === focusIndex;

                  return (
                    <div
                      key={item.key}
                      data-item-key={item.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="border-b border-[var(--s3-window-border)]"
                      onContextMenu={() => setContextTarget({ type: "item", item })}
                    >
                      {item.type === "folder" ? (
                        <FolderRow
                          item={item}
                          isSelected={isSelected}
                          isFocused={isFocused}
                          onSelect={toggleSelect}
                          onOpen={openFolder}
                        />
                      ) : (
                        <FileRow
                          item={item}
                          isSelected={isSelected}
                          isFocused={isFocused}
                          onSelect={toggleSelect}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ContextMenu.Trigger>

          {/* ── Status bar ───────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 h-8 border-t border-[var(--s3-statusbar-border)] bg-[var(--s3-statusbar-bg)] text-xs text-[var(--s3-window-muted)] shrink-0">
            <span>
              {displayedItems.length} item{displayedItems.length !== 1 ? "s" : ""}
              {filterQuery ? ` (filtered)` : ""}
            </span>
            <div className="flex items-center gap-3">
              {selectedKeys.size > 0 && (
                <span className="text-[var(--s3-accent-text)] font-medium">
                  {selectedKeys.size} selected
                </span>
              )}
              <div className="flex items-center gap-2 w-20 justify-end">
                {/* Connectivity indicator */}
                <div
                  className="flex items-center gap-1"
                  title={isOnline ? "Online" : "Offline"}
                >
                  <Circle
                    size={8}
                    className={isOnline ? "text-green-500" : "text-red-500"}
                    fill="currentColor"
                  />
                  <span className="text-xs">{isOnline ? "Online" : "Offline"}</span>
                </div>
                {/* Activity indicator */}
                <div
                  className="flex items-center gap-1"
                  title={activityTooltip}
                >
                  <ArrowUpDown
                    size={14}
                    className={`${
                      isActivity
                        ? "text-[var(--s3-accent-text)] animate-pulse"
                        : "text-[var(--s3-window-muted)] opacity-40"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Unified context menu ────────────────────────── */}
        <ContextMenu.Portal>
          <ContextMenu.Content className={MENU_CONTENT}>
            {/* ── Unified context menu ──────────────────────── */}
            {menuItems.isItemMulti ? (
              <>
                <ContextMenu.Item className={MENU_ITEM} disabled={selectedKeys.size === 0} onSelect={handleCopy}>
                  <Copy size={15} /> Copy <span className={MENU_SHORTCUT}>{menuItems.count}</span>
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={MENU_ITEM}
                  disabled={clipboard.items.length === 0}
                  onSelect={handlePaste}
                >
                  <ClipboardPaste size={15} /> Paste
                </ContextMenu.Item>
                <ContextMenu.Item className={MENU_ITEM} onSelect={() => {
                  setBulkDeleteItems(menuItems.items);
                }}>
                  <Trash2 size={15} /> Delete <span className={MENU_SHORTCUT}>{menuItems.count}</span>
                </ContextMenu.Item>
                {!menuItems.isMixed && (
                  <>
                    <ContextMenu.Separator className={MENU_SEPARATOR} />
                    <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleDownloadZip(menuItems.items)}>
                      <Archive size={15} /> Download as ZIP
                    </ContextMenu.Item>
                  </>
                )}
              </>
            ) : menuItems.isItem ? (
              menuItems.isSingleFile ? (
                <>
                  <ContextMenu.Item className={MENU_ITEM} onSelect={handleCopy}>
                    <Copy size={15} /> Copy
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className={MENU_ITEM}
                    disabled={clipboard.items.length === 0}
                    onSelect={handlePaste}
                  >
                    <ClipboardPaste size={15} /> Paste
                  </ContextMenu.Item>
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleRename(menuItems.items[0])}>
                    <Pencil size={15} /> Rename
                  </ContextMenu.Item>
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleDelete(menuItems.items[0])}>
                    <Trash2 size={15} /> Delete
                  </ContextMenu.Item>
                  <ContextMenu.Separator className={MENU_SEPARATOR} />
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleDownloadItem(menuItems.items[0])}>
                    <Download size={15} /> Download
                  </ContextMenu.Item>
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleGetUrl(menuItems.items[0])}>
                    <Link size={15} /> Get URL
                  </ContextMenu.Item>
                  <ContextMenu.Separator className={MENU_SEPARATOR} />
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleGetInfo(menuItems.items[0])}>
                    <Info size={15} /> Get Info
                  </ContextMenu.Item>
                </>
              ) : (
                <>
                  <ContextMenu.Item className={MENU_ITEM} onSelect={handleCopy}>
                    <Copy size={15} /> Copy
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className={MENU_ITEM}
                    disabled={clipboard.items.length === 0}
                    onSelect={handlePaste}
                  >
                    <ClipboardPaste size={15} /> Paste
                  </ContextMenu.Item>
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleRename(menuItems.items[0])}>
                    <Pencil size={15} /> Rename
                  </ContextMenu.Item>
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleDelete(menuItems.items[0])}>
                    <Trash2 size={15} /> Delete
                  </ContextMenu.Item>
                  <ContextMenu.Separator className={MENU_SEPARATOR} />
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleDownloadZip(menuItems.items)}>
                    <Archive size={15} /> Download as ZIP
                  </ContextMenu.Item>
                  <ContextMenu.Separator className={MENU_SEPARATOR} />
                  <ContextMenu.Item className={MENU_ITEM} onSelect={() => handleGetInfo(menuItems.items[0])}>
                    <Info size={15} /> Get Info
                  </ContextMenu.Item>
                </>
              )
            ) : (
              <>
                {/* ── Empty area context ──────────────────────── */}
                <ContextMenu.Item
                  className={MENU_ITEM}
                  disabled={selectedKeys.size === 0}
                  onSelect={handleCopy}
                >
                  <Copy size={15} />
                  Copy
                  <span className={MENU_SHORTCUT}>{selectedKeys.size > 0 ? `${selectedKeys.size}` : ""}</span>
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={MENU_ITEM}
                  disabled={clipboard.items.length === 0}
                  onSelect={handlePaste}
                >
                  <ClipboardPaste size={15} />
                  Paste
                </ContextMenu.Item>
                <ContextMenu.Separator className={MENU_SEPARATOR} />
                <ContextMenu.Item className={MENU_ITEM} onSelect={handleUpload}>
                  <Upload size={15} />
                  Upload
                  <span className={MENU_SHORTCUT}>Ctrl+U</span>
                </ContextMenu.Item>
                <ContextMenu.Item className={MENU_ITEM} onSelect={handleNewFolder}>
                  <FolderPlus size={15} />
                  New Folder
                  <span className={MENU_SHORTCUT}>Ctrl+N</span>
                </ContextMenu.Item>
                <ContextMenu.Separator className={MENU_SEPARATOR} />
                <ContextMenu.Item className={MENU_ITEM} onSelect={handleRefresh}>
                  <RefreshCw size={15} />
                  Reload
                  <span className={MENU_SHORTCUT}>F5</span>
                </ContextMenu.Item>
              </>
            )}
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>

      {/* ── New Folder Modal ──────────────────────────────── */}
      <NewFolderModal
        open={newFolderOpen}
        name={newFolderName}
        creating={newFolderCreating}
        onNameChange={setNewFolderName}
        onConfirm={confirmNewFolder}
        onCancel={onNewFolderClose}
      />

      {/* ── Delete Confirmation Modal ────────────────────────── */}
      <DeleteConfirmModal
        open={deleteTarget !== null || bulkDeleteItems !== null}
        item={deleteTarget}
        bulkCount={bulkDeleteItems?.length ?? 0}
        onConfirm={async () => {
          if (deleteTarget) {
            const target = deleteTarget;
            if (!connectionId || !bucket || !target) return;
            try {
              if (target.type === "folder") {
                await deleteFolderRecursive(target.key);
              } else {
                await deleteItem.mutateAsync({ connectionId, bucket, key: target.key });
              }
              setDeleteTarget(null);
              setSelectedKeys(new Set());
              setContextTarget({ type: "empty" });
              queryClient.invalidateQueries({
                queryKey: ["s3", "objects", connectionId, bucket, prefix],
              });
            } catch (_) {
              setDeleteTarget(null);
            }
          } else if (bulkDeleteItems) {
            handleBulkDelete(bulkDeleteItems);
            setBulkDeleteItems(null);
          }
        }}
        onCancel={() => {
          setDeleteTarget(null);
          setBulkDeleteItems(null);
        }}
      />

      {/* ── Rename Modal ──────────────────────────────────── */}
      <RenameModal
        open={renameTarget !== null}
        item={renameTarget}
        name={renameName}
        loading={renameLoading}
        error={renameError}
        onNameChange={setRenameName}
        onConfirm={confirmRename}
        onCancel={() => {
          setRenameError(null);
          setRenameTarget(null);
        }}
      />

      {/* ── Info Modal ────────────────────────────────────── */}
      <InfoModal
        data={infoData}
        onClose={() => setInfoData(null)}
      />

      {/* ── URL Modal ─────────────────────────────────────── */}
      <UrlModal
        url={urlData}
        onClose={() => setUrlData(null)}
      />

      {/* ── Zip Error Modal ──────────────────────────────── */}
      <ZipErrorModal
        message={zipError}
        onClose={() => setZipError(null)}
      />

      {/* ── Upload Modal ──────────────────────────────────── */}
      <UploadModal
        open={uploadOpen}
        connectionId={connectionId}
        bucket={bucket}
        prefix={prefix}
        getConnection={getConnection}
        dropFiles={dropFiles}
        onClose={() => {
          setDropFiles(undefined);
          onUploadClose();
        }}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}

// ─── Info Modal ──────────────────────────────────
function InfoModal({
  data,
  onClose,
}: {
  data: { title: string; type: string; rows: { label: string; value: string }[] } | null;
  onClose: () => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
            {data.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.type} Info</p>
        </div>

        {/* Info rows */}
        <div className="px-5 pb-2 space-y-1 max-h-72 overflow-y-auto">
          {data.rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">{row.label}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-mono">
                  {row.value}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(row.value, i)}
                className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)] transition-colors"
                title={`Copy ${row.label}`}
              >
                {copiedIndex === i ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end px-5 pb-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer mt-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── URL Modal ───────────────────────────────────
function UrlModal({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Presigned URL
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This URL expires in 1 hour. Already copied to clipboard.
          </p>
        </div>

        {/* URL display */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-mono truncate min-w-0">
              {url}
            </p>
            <button
              onClick={copyUrl}
              className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)] transition-colors"
              title="Copy URL"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Zip Error Modal ──────────────────────────────
function ZipErrorModal({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-red-600 dark:text-red-400">
            Download Limit Exceeded
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Folder Modal ────────────────────────────
function NewFolderModal({
  open,
  name,
  creating,
  onNameChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  name: string;
  creating: boolean;
  onNameChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            New Folder
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter a name for the new folder.
          </p>
        </div>

        {/* Input */}
        <div className="px-5 pb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !creating) {
                onConfirm();
              }
              if (e.key === "Escape") onCancel();
            }}
            placeholder="Folder name"
            autoFocus
            className="
              w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
              outline-none focus:border-[var(--s3-accent-active)] focus:ring-1 focus:ring-[var(--s3-accent-base)]
              bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
              placeholder-gray-400 dark:placeholder-gray-500
              transition-all
            "
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={creating}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!name.trim() || creating}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-[var(--s3-accent-active)] text-white
              hover:bg-[var(--s3-accent-hover)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rename Modal ────────────────────────────────
function RenameModal({
  open,
  item,
  name,
  loading,
  error,
  onNameChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  item: S3Item | null;
  name: string;
  loading: boolean;
  error?: string | null;
  onNameChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Rename {item.type === "folder" ? "Folder" : "File"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter a new name for <strong>{item.name}</strong>.
          </p>
        </div>

        {/* Input */}
        <div className="px-5 pb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !loading) {
                onConfirm();
              }
              if (e.key === "Escape") onCancel();
            }}
            placeholder="New name"
            autoFocus
            className="
              w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
              outline-none focus:border-[var(--s3-accent-active)] focus:ring-1 focus:ring-[var(--s3-accent-base)]
              bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
              placeholder-gray-400 dark:placeholder-gray-500
              transition-all
            "
          />
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 pb-4">
            <p className="text-xs text-red-500 dark:text-red-400 leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!name.trim() || loading}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-[var(--s3-accent-active)] text-white
              hover:bg-[var(--s3-accent-hover)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {loading ? "Renaming…" : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ───────────────────
function DeleteConfirmModal({
  open,
  item,
  bulkCount,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  item: S3Item | null;
  bulkCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  const isBulk = bulkCount && bulkCount > 0 && !item;
  if (!isBulk && !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-red-600 dark:text-red-400">
            {isBulk ? `Delete ${bulkCount} Items` : `Delete ${item!.type === "folder" ? "Folder" : "File"}`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {isBulk ? (
              <span>Are you sure you want to delete <strong>{bulkCount} items</strong>?</span>
            ) : (
              <>
                Are you sure you want to delete <strong>{item!.name}</strong>?
                {item!.type === "folder" && (
                  <span className="block mt-1">All contents inside will be permanently removed.</span>
                )}
              </>
            )}
            <span className="block mt-1">This action cannot be undone.</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-red-600 hover:bg-red-700 text-white
              transition-colors
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Column Header ──────────────────────────────────────────

interface ColumnHeaderProps {
  disabled?: boolean;
  sortField?: SortField;
  sortDir?: SortDirection;
  onToggleSort?: (field: SortField) => void;
  SortIcon?: React.ComponentType<{ field: SortField }>;
}

function ColumnHeader({
  disabled,
  sortField: _sf,
  sortDir: _sd,
  onToggleSort,
  SortIcon,
}: ColumnHeaderProps) {
  // Use a simpler header when disabled (loading/empty/error state)
  if (disabled || !onToggleSort || !SortIcon) {
    return (
      <div
        className={`${ROW_GRID} h-10 px-3 gap-2 border-b border-[var(--s3-window-border)] bg-[var(--s3-statusbar-bg)] text-xs font-medium text-[var(--s3-window-muted)] shrink-0`}
      >
        <span />
        <span>Name</span>
        <span className="text-right">Size</span>
        <span className="text-right">Modified</span>
        <span className="text-right">Class</span>
      </div>
    );
  }

  const fields: { key: SortField; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "size", label: "Size" },
    { key: "lastModified", label: "Modified" },
    { key: "storageClass", label: "Class" },
  ];

  return (
    <div
      className={`${ROW_GRID} h-10 px-3 gap-2 border-b border-[var(--s3-window-border)] bg-[var(--s3-statusbar-bg)] text-xs font-medium text-[var(--s3-window-muted)] shrink-0`}
    >
      <span />
      {fields.map((f) => (
        <button
          key={f.key}
          onClick={() => onToggleSort(f.key)}
          className={`
            flex items-center gap-1 hover:text-[var(--s3-window-text)] transition-colors
            ${f.key === "name" ? "" : "justify-end"}
          `}
        >
          {f.label}
          <SortIcon field={f.key} />
        </button>
      ))}
    </div>
  );
}
