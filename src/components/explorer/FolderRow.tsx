import { Folder } from "lucide-react";
import type { S3Item } from "../../types";
import { formatDate } from "../../lib/utils";
import { ROW_GRID } from "./FileRow";

// ─── Component ──────────────────────────────────────────────

interface FolderRowProps {
  item: S3Item;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (item: S3Item) => void;
  /** Double-click → navigate into the folder */
  onOpen: (item: S3Item) => void;
  onContextMenu?: (item: S3Item, e: React.MouseEvent) => void;
}

export default function FolderRow({
  item,
  isSelected,
  isFocused,
  onSelect,
  onOpen,
  onContextMenu,
}: FolderRowProps) {
  return (
    <div
      role="row"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onDoubleClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      onContextMenu={(e) => onContextMenu?.(item, e)}
      className={`
        ${ROW_GRID} h-full px-3 gap-2 cursor-default select-none
        transition-colors duration-75
        ${isSelected ? "bg-[var(--s3-accent-light)] text-[var(--s3-accent)]" : "hover:bg-[var(--s3-window-hover-bg)]"}
        ${isFocused ? "ring-2 ring-inset ring-blue-400" : ""}
      `}
    >
      {/* Icon */}
      <div className="flex items-center justify-center">
        <Folder size={17} className="text-[var(--s3-accent)] opacity-70" />
      </div>

      {/* Name */}
      <span className="truncate text-sm font-medium text-[var(--s3-window-text)]">{item.name}</span>

      {/* Size — folders have no size */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right">—</span>

      {/* Last modified */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right tabular-nums">
        {item.lastModified ? formatDate(item.lastModified) : "—"}
      </span>

      {/* Storage class */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right">—</span>
    </div>
  );
}
