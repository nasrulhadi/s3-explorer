import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as ContextMenu from "@radix-ui/react-context-menu";
import JSZip from "jszip";
import {
  ArrowUpDown,
  FolderOpen,
  FileX,
  AlertCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useS3 } from "../../hooks/useS3";

import { useNavigationStore } from "../../store/navigationStore";
import { useTransferStore } from "../../store/transferStore";
import { useConnectionStore } from "../../store/connectionStore";
import { useSettingsStore } from "../../store/settingsStore";
import { createS3Client } from "../../lib/s3Client";
import { formatFileSize } from "../../lib/utils";
import { deleteFolderRecursive, renameFolder } from "../../lib/s3FolderOps";
import type { S3Item, SortField, SortDirection } from "../../types";
import { ROW_HEIGHT, colGridStyle } from "./FileRow";
import FolderRow from "./FolderRow";
import FileRow from "./FileRow";
import UploadModal from "../modals/UploadModal";
import ColumnHeader from "./ColumnHeader";
import ExplorerContextMenu from "./ExplorerContextMenu";

// ── Modals (extracted to separate files) ──
import NewFolderModal from "../modals/NewFolderModal";
import RenameModal from "../modals/RenameModal";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";
import InfoModal from "../modals/InfoModal";
import UrlModal from "../modals/UrlModal";
import ZipErrorModal from "../modals/ZipErrorModal";

// ── Custom hooks ──
import { useFileSelection } from "./hooks/useFileSelection";
import { useFileClipboard } from "./hooks/useFileClipboard";
import { useDragMove } from "./hooks/useDragMove";

// ─── Skeleton row (loading placeholder) ─────────────────────

function SkeletonRow() {
  const columnWidths = useSettingsStore((s) => s.columnWidths);
  return (
    <div style={colGridStyle(columnWidths)} className="grid min-h-10 px-3 gap-2 items-center border-b border-[var(--s3-window-border)]">
      <div className="h-4 w-4 rounded bg-[var(--s3-window-hover-bg)] animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-[var(--s3-window-hover-bg)] animate-pulse pr-3" />
      <div className="h-4 w-12 rounded bg-[var(--s3-window-hover-bg)] animate-pulse justify-self-end pr-3" />
      <div className="h-4 w-20 rounded bg-[var(--s3-window-hover-bg)] animate-pulse justify-self-end pr-3" />
      <div className="h-4 w-14 rounded bg-[var(--s3-window-hover-bg)] animate-pulse justify-self-end pr-3" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface FileListProps {
  filterQuery: string;
  uploadOpen: boolean;
  onUploadClose: () => void;
  onUploadOpen: () => void;
  newFolderOpen: boolean;
  onNewFolderClose: () => void;
  onNewFolderOpen: () => void;
}

export default function FileList({
  filterQuery,
  uploadOpen,
  onUploadClose,
  onUploadOpen,
  newFolderOpen,
  onNewFolderClose,
  onNewFolderOpen,
}: FileListProps) {
  // ── S3 & Navigation ──
  const {
    listObjects,
    downloadFile,
    getPresignedUrl,
    renameItem,
    deleteItem,
    headObject,
    createFolder,
  } = useS3();

  const connectionId = useNavigationStore((s) => s.connectionId);
  const bucket = useNavigationStore((s) => s.bucket);
  const prefix = useNavigationStore((s) => s.prefix);
  const setPrefix = useNavigationStore((s) => s.setPrefix);

  const connections = useConnectionStore((s) => s.connections);
  const getConnection = useCallback(
    (id: string) => connections.find((c) => c.id === id)!,
    [connections],
  );
  const queryClient = useQueryClient();

  // ── Data ──
  const { data, isLoading, isFetching, isError, error } = listObjects(connectionId, bucket, prefix);

  // ── Activity ──
  const transfers = useTransferStore((s) => s.transfers);
  const activeTransfers = useMemo(
    () => transfers.filter((t) => t.status === "active"),
    [transfers],
  );
  const hasActiveTransfers = activeTransfers.length > 0;
  const isActivity = isLoading || isFetching || hasActiveTransfers;
  const activityTooltip = isLoading || isFetching
    ? "Loading folder..."
    : hasActiveTransfers
    ? `${activeTransfers.length} transfer${activeTransfers.length > 1 ? "s" : ""} in progress`
    : "No activity";

  // ── Sort ──
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField]);

  // ── Filter + sort pipeline ──
  const displayedItems = useMemo(() => {
    const items = data?.items ?? [];
    const filtered = filterQuery
      ? items.filter((i) => i.name.toLowerCase().includes(filterQuery.toLowerCase()))
      : items;
    return [...filtered].sort((a, b) => {
      if (a.type !== b.type) {
        if (a.type === "folder") return -1;
        if (b.type === "folder") return 1;
      }
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "size": cmp = (a.size ?? 0) - (b.size ?? 0); break;
        case "lastModified": cmp = (a.lastModified?.getTime() ?? 0) - (b.lastModified?.getTime() ?? 0); break;
        case "storageClass": cmp = (a.storageClass ?? "").localeCompare(b.storageClass ?? ""); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, filterQuery, sortField, sortDir]);

  const skeletonCountRef = useRef(8);
  useEffect(() => {
    if (displayedItems.length > 0) skeletonCountRef.current = displayedItems.length;
  }, [displayedItems]);

  // ── Virtualization ──
  const virtualizer = useVirtualizer({
    count: displayedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });
  const parentRef = useRef<HTMLDivElement>(null);

  // ── Folder navigation ──
  const openFolder = useCallback((item: S3Item) => setPrefix(item.key), [setPrefix]);
  const openItem = useCallback(
    (item: S3Item) => { if (item.type === "folder") openFolder(item); },
    [openFolder],
  );

  // ── Selection hook ──
  const {
    selectedKeys, focusIndex,
    toggleSelect, clearSelection, handleKeyDown,
    setSelectedKeys, setFocusIndex,
  } = useFileSelection(displayedItems, openItem);

  // ── Clipboard hook ──
  const { handleCopy, handlePaste, clipboard } = useFileClipboard(
    connectionId, bucket, prefix, displayedItems, selectedKeys,
  );

  // ── Drag & Drop hook ──
  const {
    dragOverKey, movingKeys,
    handleContainerMouseMove, handleContainerMouseUp, onMouseLeave,
    setDragSource, resetDrag, setMovingKeys,
  } = useDragMove(connectionId, bucket, prefix, displayedItems, selectedKeys, clearSelection);

  // Clean up selection/drag on navigation
  useEffect(() => {
    setSelectedKeys(new Set());
    setMovingKeys(new Set());
    setContextTarget({ type: "empty" });
    setFocusIndex(-1);
    resetDrag();
  }, [connectionId, bucket, prefix, data]);

  useEffect(() => {
    const onDocMouseUp = resetDrag;
    document.addEventListener("mouseup", onDocMouseUp);
    return () => document.removeEventListener("mouseup", onDocMouseUp);
  }, [resetDrag]);

  // ── Context menu target ──
  const [contextTarget, setContextTarget] = useState<{ type: "item" | "empty"; item?: S3Item }>({ type: "empty" });

  // ── Modals state ──
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
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderCreating, setNewFolderCreating] = useState(false);

  // ── New Folder ──
  useEffect(() => { if (newFolderOpen) setNewFolderName(""); }, [newFolderOpen]);

  const handleNewFolder = useCallback(() => {
    if (!connectionId || !bucket) return;
    setNewFolderName("");
    onNewFolderOpen();
  }, [connectionId, bucket, onNewFolderOpen]);

  const confirmNewFolder = useCallback(async () => {
    if (!connectionId || !bucket || !newFolderName.trim()) return;
    setNewFolderCreating(true);
    try {
      await createFolder.mutateAsync({ connectionId, bucket, prefix, folderName: newFolderName.trim() });
      onNewFolderClose();
      queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
    } catch (_) { /* silent */ } finally {
      setNewFolderCreating(false);
    }
  }, [connectionId, bucket, prefix, newFolderName, createFolder, queryClient, onNewFolderClose]);

  // ── Refresh ──
  const handleRefresh = useCallback(() => {
    if (!connectionId || !bucket) return;
    queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
  }, [queryClient, connectionId, bucket, prefix]);

  // ── Upload ──
  const handleUpload = useCallback(() => onUploadOpen(), [onUploadOpen]);
  const handleUploadComplete = useCallback(() => {
    if (connectionId && bucket) {
      queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
    }
  }, [connectionId, bucket, prefix, queryClient]);

  // ── Rename ──
  const handleRename = useCallback((item: S3Item) => {
    setRenameError(null);
    setRenameName(item.name);
    setRenameTarget(item);
  }, []);

  const confirmRename = useCallback(async () => {
    if (!connectionId || !bucket || !renameTarget || !renameName.trim()) return;
    if (renameName.trim() === renameTarget.name) { setRenameTarget(null); return; }
    setRenameLoading(true);
    setRenameError(null);
    const conn = getConnection(connectionId);
    if (!conn) { setRenameLoading(false); return; }
    const isFolder = renameTarget.key.endsWith("/");
    const baseKey = isFolder ? renameTarget.key.slice(0, -1) : renameTarget.key;
    const lastSlash = baseKey.lastIndexOf("/");
    const newKeyBase = lastSlash === -1 ? renameName.trim() : baseKey.slice(0, lastSlash + 1) + renameName.trim();
    const newKey = isFolder ? newKeyBase + "/" : newKeyBase;
    const oldKey = renameTarget.key;
    try {
      if (isFolder) {
        const client = createS3Client(conn);
        const ok = await renameFolder(client, bucket, oldKey, newKey, conn.provider);
        if (!ok) {
          setRenameError("This folder can't be renamed — it might be a virtual folder. Use New Folder to create a real folder first.");
          setRenameLoading(false);
          return;
        }
      } else {
        await renameItem.mutateAsync({ connectionId, bucket, oldKey, newKey });
      }
      setRenameTarget(null);
      setSelectedKeys(new Set());
      setContextTarget({ type: "empty" });
      queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
    } catch (err) {
      console.error("Rename failed:", err);
      setRenameError("Rename failed. The operation may have partially completed.");
    } finally { setRenameLoading(false); }
  }, [connectionId, bucket, renameTarget, renameName, renameItem, getConnection, queryClient, prefix, setSelectedKeys]);

  // ── Delete ──
  const handleDelete = useCallback((item: S3Item) => setDeleteTarget(item), []);
  const handleBulkDelete = useCallback(async (items: S3Item[]) => {
    if (!connectionId || !bucket || items.length === 0) return;
    const conn = getConnection(connectionId);
    if (!conn) return;
    for (const item of items) {
      if (item.type === "folder") {
        const client = createS3Client(conn);
        await deleteFolderRecursive(client, bucket, item.key, conn.provider);
      } else {
        await deleteItem.mutateAsync({ connectionId, bucket, key: item.key });
      }
    }
    setSelectedKeys(new Set());
    setContextTarget({ type: "empty" });
    queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
  }, [connectionId, bucket, deleteItem, getConnection, queryClient, prefix, setSelectedKeys]);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget) {
      const target = deleteTarget;
      if (!connectionId || !bucket || !target) return;
      try {
        if (target.type === "folder") {
          const conn = getConnection(connectionId);
          if (!conn) return;
          const client = createS3Client(conn);
          await deleteFolderRecursive(client, bucket, target.key, conn.provider);
        } else {
          await deleteItem.mutateAsync({ connectionId, bucket, key: target.key });
        }
        setDeleteTarget(null);
        setSelectedKeys(new Set());
        setContextTarget({ type: "empty" });
        queryClient.invalidateQueries({ queryKey: ["s3", "objects", connectionId, bucket, prefix] });
      } catch (_) { setDeleteTarget(null); }
    } else if (bulkDeleteItems) {
      handleBulkDelete(bulkDeleteItems);
      setBulkDeleteItems(null);
    }
  }, [deleteTarget, bulkDeleteItems, connectionId, bucket, deleteItem, getConnection, queryClient, prefix, setSelectedKeys, handleBulkDelete]);

  const handleDeleteCancel = useCallback(() => { setDeleteTarget(null); setBulkDeleteItems(null); }, []);

  // ── Download ──
  const handleDownloadItem = useCallback((item: S3Item) => {
    if (!connectionId || !bucket) return;
    downloadFile.mutateAsync({ connectionId, bucket, key: item.key });
  }, [connectionId, bucket, downloadFile]);

  // ── ZIP ──
  const ZIP_LIMIT_FILES = 250;
  const ZIP_LIMIT_BYTES = 500 * 1024 * 1024;
  const handleDownloadZip = useCallback(async (items: S3Item[]) => {
    if (!connectionId || !bucket) return;
    setZipError(null);
    const allItems: { key: string; name: string; size: number }[] = [];
    for (const item of items) {
      if (item.type === "folder" && item.key.endsWith("/")) {
        const client = createS3Client(getConnection(connectionId));
        const listed = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: item.key }));
        for (const obj of listed.Contents ?? []) {
          if (!obj.Key || obj.Key === item.key) continue;
          allItems.push({ key: obj.Key, name: obj.Key.slice(item.key.length), size: obj.Size ?? 0 });
        }
      } else {
        allItems.push({ key: item.key, name: item.name, size: item.size ?? 0 });
      }
    }
    const totalSize = allItems.reduce((s, i) => s + i.size, 0);
    if (allItems.length > ZIP_LIMIT_FILES || totalSize > ZIP_LIMIT_BYTES) {
      setZipError(`Download as ZIP is limited to ${ZIP_LIMIT_FILES} files or ${(ZIP_LIMIT_BYTES / 1024 / 1024).toFixed(0)} MB total. Selected: ${allItems.length} file${allItems.length > 1 ? "s" : ""}, ${(totalSize / 1024 / 1024).toFixed(1)} MB.`);
      return;
    }
    const transferId = `zip-${Date.now()}`;
    useTransferStore.getState().addTransfer({ id: transferId, type: "download", fileName: `${items.length === 1 ? items[0].name : "files"}.zip`, totalBytes: totalSize, transferredBytes: 0, status: "active", bucket, connectionId });
    const zip = new JSZip();
    let downloaded = 0;
    for (const entry of allItems) {
      try {
        const conn = getConnection(connectionId);
        if (!conn) continue;
        const client = createS3Client(conn);
        const signedUrl = await getSignedUrl(client as never, new GetObjectCommand({ Bucket: bucket, Key: entry.key }), { expiresIn: 300 });
        const response = await tauriFetch(signedUrl);
        if (!response.ok) continue;
        const blob = await response.blob();
        zip.file(entry.name, blob);
        downloaded += entry.size;
        useTransferStore.getState().updateTransfer(transferId, { transferredBytes: downloaded });
      } catch (_) { /* skip */ }
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const blobUrl = URL.createObjectURL(zipBlob);
    try {
      const handle = await (window as any).showSaveFilePicker?.({ suggestedName: `${items.length === 1 ? items[0].name : "files"}.zip` });
      if (handle) { const writable = await handle.createWritable(); await writable.write(zipBlob); await writable.close(); URL.revokeObjectURL(blobUrl); useTransferStore.getState().updateTransfer(transferId, { status: "done", transferredBytes: totalSize }); return; }
    } catch { /* fallback */ }
    const anchor = document.createElement("a");
    anchor.href = blobUrl; anchor.download = `${items.length === 1 ? items[0].name : "files"}.zip`; anchor.style.display = "none";
    document.body.appendChild(anchor); anchor.click();
    setTimeout(() => { document.body.removeChild(anchor); URL.revokeObjectURL(blobUrl); }, 5000);
    useTransferStore.getState().updateTransfer(transferId, { status: "done", transferredBytes: totalSize });
  }, [connectionId, bucket, getConnection]);

  // ── URL & Info ──
  const handleGetUrl = useCallback((item: S3Item) => {
    if (!connectionId || !bucket) return;
    getPresignedUrl.mutateAsync({ connectionId, bucket, key: item.key }).then(async (url) => { await navigator.clipboard.writeText(url); setUrlData(url); });
  }, [connectionId, bucket, getPresignedUrl]);

  const handleGetInfo = useCallback((item: S3Item) => {
    if (!connectionId || !bucket) return;
    headObject.mutateAsync({ connectionId, bucket, key: item.key }).then((meta) => {
      const rows: { label: string; value: string }[] = [
        { label: "Name", value: item.name }, { label: "Key", value: item.key }, { label: "Type", value: item.type === "folder" ? "Folder" : "File" },
      ];
      if (meta.size !== undefined) rows.push({ label: "Size", value: formatFileSize(meta.size) });
      if (meta.lastModified) rows.push({ label: "Last Modified", value: meta.lastModified.toLocaleString() });
      if (meta.contentType) rows.push({ label: "Content Type", value: meta.contentType });
      if (meta.storageClass) rows.push({ label: "Storage Class", value: meta.storageClass });
      if (meta.etag) rows.push({ label: "ETag", value: meta.etag });
      setInfoData({ title: item.name, type: item.type === "folder" ? "Folder" : "File", rows });
    });
  }, [connectionId, bucket, headObject]);

  // ── Status bar ─────────────────────────────────────────────
  function StatusBar() {
    return (
      <div className="flex items-center justify-between px-4 h-8 border-t border-[var(--s3-statusbar-border)] bg-[var(--s3-statusbar-bg)] text-xs text-[var(--s3-window-muted)] shrink-0">
        <span>{displayedItems.length} item{displayedItems.length !== 1 ? "s" : ""}{filterQuery ? ` (filtered)` : ""}</span>
        <div className="flex items-center gap-3">
          {selectedKeys.size > 0 && (
            <span className="text-[var(--s3-accent-text)] font-medium">{selectedKeys.size} selected</span>
          )}
          <div className="flex items-center gap-2 w-20 justify-end">
            <div className="flex items-center gap-1" title={activityTooltip}>
              <ArrowUpDown size={14} className={isActivity ? "text-[var(--s3-accent-text)] animate-pulse" : "text-[var(--s3-window-muted)] opacity-40"} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Shared modals rendered ONCE for all states ───────────
  function Modals() {
    return (
      <>
        <NewFolderModal open={newFolderOpen} name={newFolderName} creating={newFolderCreating} onNameChange={setNewFolderName} onConfirm={confirmNewFolder} onCancel={onNewFolderClose} />
        <DeleteConfirmModal open={deleteTarget !== null || bulkDeleteItems !== null} item={deleteTarget} bulkCount={bulkDeleteItems?.length ?? 0} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
        <RenameModal open={renameTarget !== null} item={renameTarget} name={renameName} loading={renameLoading} error={renameError} onNameChange={setRenameName} onConfirm={confirmRename} onCancel={() => { setRenameError(null); setRenameTarget(null); }} />
        <InfoModal data={infoData} onClose={() => setInfoData(null)} />
        <UrlModal url={urlData} onClose={() => setUrlData(null)} />
        <ZipErrorModal message={zipError} onClose={() => setZipError(null)} />
        <UploadModal open={uploadOpen} connectionId={connectionId} bucket={bucket} prefix={prefix} getConnection={getConnection} dropFiles={dropFiles} onClose={() => { setDropFiles(undefined); onUploadClose(); }} onUploadComplete={handleUploadComplete} />
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────

  // Loading / Refetch
  if (isLoading || isFetching) {
    return (
      <>
        <div className="h-full flex flex-col bg-[var(--s3-window-bg)] overflow-hidden">
          <ColumnHeader disabled />
          <div className="flex-1">
            {Array.from({ length: skeletonCountRef.current }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
          <StatusBar />
        </div>
        <Modals />
      </>
    );
  }

  // Error
  if (isError) {
    return (
      <>
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[var(--s3-window-bg)]">
          <AlertCircle size={40} className="text-[var(--s3-danger)] mb-3" />
          <p className="text-sm font-medium text-[var(--s3-danger)]">Failed to load contents</p>
          <p className="text-xs text-[var(--s3-window-muted)] mt-1 max-w-xs">{(error as Error).message}</p>
        </div>
        <Modals />
      </>
    );
  }

  // Empty
  if (displayedItems.length === 0) {
    return (
      <>
        <ContextMenu.Root onOpenChange={(open) => { if (!open) setContextTarget({ type: "empty" }); }}>
          <ContextMenu.Trigger asChild>
            <div className="h-full flex flex-col bg-[var(--s3-window-bg)] overflow-hidden">
              <ColumnHeader disabled />
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-[var(--s3-window-muted)]">
                {filterQuery ? (
                  <>
                    <FileX size={40} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium text-[var(--s3-window-muted)]">No items match your filter</p>
                    <p className="text-xs mt-1 opacity-70">Try a different search term or clear the filter.</p>
                  </>
                ) : (
                  <>
                    <FolderOpen size={40} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium text-[var(--s3-window-muted)]">This folder is empty</p>
                    <p className="text-xs mt-1 opacity-70">Upload files or create a folder to get started.</p>
                  </>
                )}
              </div>
            </div>
          </ContextMenu.Trigger>
          <ExplorerContextMenu displayedItems={displayedItems} selectedKeys={selectedKeys} contextTarget={contextTarget} clipboardCount={clipboard.items.length} onCopy={handleCopy} onPaste={handlePaste} onUpload={handleUpload} onNewFolder={handleNewFolder} onRefresh={handleRefresh} onRename={handleRename} onDelete={handleDelete} onBulkDelete={(items) => setBulkDeleteItems(items)} onDownloadItem={handleDownloadItem} onDownloadZip={handleDownloadZip} onGetUrl={handleGetUrl} onGetInfo={handleGetInfo} />
        </ContextMenu.Root>
        <Modals />
      </>
    );
  }

  // Normal (virtualized list)
  return (
    <>
      <ContextMenu.Root onOpenChange={(open) => { if (!open) setContextTarget({ type: "empty" }); }}>
        <div className="h-full flex flex-col bg-[var(--s3-window-bg)] overflow-hidden outline-none" onKeyDown={handleKeyDown} onContextMenu={(e) => e.preventDefault()} tabIndex={-1}>
          <ColumnHeader sortField={sortField} sortDir={sortDir} onToggleSort={toggleSort} />

          <ContextMenu.Trigger asChild>
            <div ref={parentRef} className="flex-1 overflow-auto outline-none" onMouseMove={handleContainerMouseMove} onMouseUp={handleContainerMouseUp} onMouseLeave={onMouseLeave}>
              <div style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const item = displayedItems[virtualRow.index];
                  const isSelected = selectedKeys.has(item.key);
                  const isFocused = virtualRow.index === focusIndex;
                  return (
                    <div
                      key={item.key}
                      data-item-key={item.key}
                      data-item-type={item.type}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                      className="border-b border-[var(--s3-window-border)]"
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        e.currentTarget.getBoundingClientRect(); // noop, suppress unused
                        setDragSource(item);
                      }}
                      onContextMenu={() => setContextTarget({ type: "item", item })}
                    >
                      {item.type === "folder" ? (
                        <FolderRow item={item} isSelected={isSelected} isFocused={isFocused} isDragOver={dragOverKey === item.key} isMoving={movingKeys.has(item.key)} onSelect={toggleSelect} onOpen={openFolder} />
                      ) : (
                        <FileRow item={item} isSelected={isSelected} isFocused={isFocused} isMoving={movingKeys.has(item.key)} onSelect={toggleSelect} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ContextMenu.Trigger>

          <StatusBar />
        </div>

        <ExplorerContextMenu displayedItems={displayedItems} selectedKeys={selectedKeys} contextTarget={contextTarget} clipboardCount={clipboard.items.length} onCopy={handleCopy} onPaste={handlePaste} onUpload={handleUpload} onNewFolder={handleNewFolder} onRefresh={handleRefresh} onRename={handleRename} onDelete={handleDelete} onBulkDelete={(items) => setBulkDeleteItems(items)} onDownloadItem={handleDownloadItem} onDownloadZip={handleDownloadZip} onGetUrl={handleGetUrl} onGetInfo={handleGetInfo} />
      </ContextMenu.Root>

      <Modals />
    </>
  );
}
