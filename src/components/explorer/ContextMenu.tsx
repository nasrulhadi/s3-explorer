import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  Download,
  Link,
  Pencil,
  Trash2,
  Info,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useS3 } from "../../hooks/useS3";
import { useNavigationStore } from "../../store/navigationStore";
import { formatFileSize } from "../../lib/utils";
import type { S3Item } from "../../types";

// ─── Props ──────────────────────────────────────────────────

interface ItemContextMenuProps {
  /** The S3 item this menu is attached to */
  item: S3Item;
  /** The row element to use as the trigger */
  children: React.ReactNode;
}

// ─── Shared menu styling ────────────────────────────────────

const MENU_CONTENT =
  "min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50";
const MENU_ITEM =
  "flex items-center gap-2.5 px-2.5 py-2 text-sm text-gray-700 rounded-md outline-none cursor-default select-none data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[disabled]:opacity-40 data-[disabled]:pointer-events-none";
const MENU_SEPARATOR = "h-px bg-gray-200 my-1";
const MENU_SHORTCUT = "ml-auto text-xs text-gray-400";

// ─── Main Component ─────────────────────────────────────────

export default function ItemContextMenu({ item, children }: ItemContextMenuProps) {
  const connectionId = useNavigationStore((s) => s.connectionId)!;
  const bucket = useNavigationStore((s) => s.bucket)!;
  const queryClient = useQueryClient();

  const {
    downloadFile,
    getPresignedUrl,
    renameItem,
    deleteItem,
    headObject,
  } = useS3();

  // Helper to invalidate the current folder query after mutations
  function invalidateList() {
    const prefix = useNavigationStore.getState().prefix;
    queryClient.invalidateQueries({
      queryKey: ["s3", "objects", connectionId, bucket, prefix],
    });
  }

  // ── FILE actions ─────────────────────────────────────────

  async function handleDownload() {
    toast.promise(
      downloadFile().mutateAsync({ connectionId, bucket, key: item.key }),
      {
        loading: `Downloading "${item.name}"…`,
        success: `Downloaded "${item.name}"`,
        error: (err) => err.message,
      },
    );
  }

  async function handleCopyUrl() {
    toast.promise(
      getPresignedUrl()
        .mutateAsync({ connectionId, bucket, key: item.key })
        .then(async (url) => {
          await navigator.clipboard.writeText(url);
        }),
      {
        loading: "Generating presigned URL…",
        success: "Link copied to clipboard (expires in 1 hour)",
        error: (err) => err.message,
      },
    );
  }

  async function handleRename() {
    const newName = window.prompt("Enter new name:", item.name);
    if (!newName || newName === item.name) return;

    // Build new key: replace only the last segment
    const lastSlash = item.key.lastIndexOf("/");
    const newKey =
      lastSlash === -1 ? newName : item.key.slice(0, lastSlash + 1) + newName;

    toast.promise(
      renameItem()
        .mutateAsync({ connectionId, bucket, oldKey: item.key, newKey })
        .then(() => invalidateList()),
      {
        loading: `Renaming to "${newName}"…`,
        success: `Renamed to "${newName}"`,
        error: (err) => err.message,
      },
    );
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?\n\nThis action cannot be undone.`,
    );
    if (!confirmed) return;

    toast.promise(
      deleteItem()
        .mutateAsync({ connectionId, bucket, key: item.key })
        .then(() => invalidateList()),
      {
        loading: `Deleting "${item.name}"…`,
        success: `Deleted "${item.name}"`,
        error: (err) => err.message,
      },
    );
  }

  async function handleGetInfo() {
    toast.promise(
      headObject()
        .mutateAsync({ connectionId, bucket, key: item.key })
        .then((meta) => {
          // Show info via a second toast (non-dismissable)
          toast.info(`File info — ${item.name}`, {
            description: [
              `Key: ${item.key}`,
              meta.size != null ? `Size: ${formatFileSize(meta.size)}` : null,
              meta.lastModified
                ? `Modified: ${meta.lastModified.toLocaleString()}`
                : null,
              meta.contentType ? `Type: ${meta.contentType}` : null,
              meta.etag ? `ETag: ${meta.etag}` : null,
              meta.storageClass ? `Class: ${meta.storageClass}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
            duration: 8000,
          });
        }),
      {
        loading: "Fetching metadata…",
        error: (err) => err.message,
      },
    );
  }

  // ── FOLDER actions ───────────────────────────────────────

  async function handleDownloadZip() {
    // Full ZIP support requires streaming multiple objects — show info toast
    toast.info("Download as ZIP", {
      description:
        "Folder ZIP download is not yet implemented. This will download all contents of the folder as a ZIP archive in a future update.",
      duration: 5000,
    });
  }

  async function handleDeleteFolder() {
    const confirmed = window.confirm(
      `Are you sure you want to delete folder "${item.name}"?\n\n` +
        `Note: This only deletes the folder placeholder object. ` +
        `Files inside the folder will NOT be deleted automatically.`,
    );
    if (!confirmed) return;

    toast.promise(
      deleteItem()
        .mutateAsync({ connectionId, bucket, key: item.key })
        .then(() => invalidateList()),
      {
        loading: `Deleting folder "${item.name}"…`,
        success: `Deleted folder "${item.name}"`,
        error: (err) => err.message,
      },
    );
  }

  async function handleFolderGetInfo() {
    toast.info(`Folder info — ${item.name}`, {
      description: [
        `Key: ${item.key}`,
        item.lastModified
          ? `Modified: ${item.lastModified.toLocaleString()}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      duration: 8000,
    });
  }

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className={MENU_CONTENT}>
          {item.type === "folder" ? (
            // ── Folder menu ──────────────────────────────────
            <>
              <ContextMenu.Item className={MENU_ITEM} onSelect={handleDownloadZip}>
                <Archive size={15} className="text-gray-400" />
                Download as ZIP
                <span className={MENU_SHORTCUT}>Soon</span>
              </ContextMenu.Item>

              <ContextMenu.Item
                className={`${MENU_ITEM} text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700`}
                onSelect={handleDeleteFolder}
              >
                <Trash2 size={15} />
                Delete Folder
              </ContextMenu.Item>

              <ContextMenu.Separator className={MENU_SEPARATOR} />

              <ContextMenu.Item className={MENU_ITEM} onSelect={handleFolderGetInfo}>
                <Info size={15} className="text-gray-400" />
                Get Info
              </ContextMenu.Item>
            </>
          ) : (
            // ── File menu ────────────────────────────────────
            <>
              <ContextMenu.Item className={MENU_ITEM} onSelect={handleDownload}>
                <Download size={15} className="text-gray-400" />
                Download
              </ContextMenu.Item>

              <ContextMenu.Item className={MENU_ITEM} onSelect={handleCopyUrl}>
                <Link size={15} className="text-gray-400" />
                Copy Presigned URL
              </ContextMenu.Item>

              <ContextMenu.Item className={MENU_ITEM} onSelect={handleRename}>
                <Pencil size={15} className="text-gray-400" />
                Rename
              </ContextMenu.Item>

              <ContextMenu.Item
                className={`${MENU_ITEM} text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700`}
                onSelect={handleDelete}
              >
                <Trash2 size={15} />
                Delete
              </ContextMenu.Item>

              <ContextMenu.Separator className={MENU_SEPARATOR} />

              <ContextMenu.Item className={MENU_ITEM} onSelect={handleGetInfo}>
                <Info size={15} className="text-gray-400" />
                Get Info
              </ContextMenu.Item>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
