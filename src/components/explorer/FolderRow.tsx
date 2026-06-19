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
        ${isSelected ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "hover:bg-gray-50 dark:hover:bg-gray-800"}
        ${isFocused ? "ring-2 ring-inset ring-blue-400" : ""}
      `}
    >
      {/* Icon */}
      <div className="flex items-center justify-center">
        <Folder size={17} className="text-blue-400 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/50" />
      </div>

      {/* Name */}
      <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</span>

      {/* Size — folders have no size */}
      <span className="text-xs text-gray-400 dark:text-gray-500 text-right">—</span>

      {/* Last modified */}
      <span className="text-xs text-gray-400 dark:text-gray-500 text-right tabular-nums">
        {item.lastModified ? formatDate(item.lastModified) : "—"}
      </span>

      {/* Storage class */}
      <span className="text-xs text-gray-400 dark:text-gray-500 text-right">—</span>
    </div>
  );
}
