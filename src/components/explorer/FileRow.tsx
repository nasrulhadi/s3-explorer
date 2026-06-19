import { icons } from "lucide-react";
import type { S3Item } from "../../types";
import { getFileIcon, formatFileSize, formatDate } from "../../lib/utils";

// ─── Helpers ────────────────────────────────────────────────

/** Convert a lucide icon slug ("file-text") to its PascalCase export name ("FileText") */
function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

// ─── Shared layout constants ────────────────────────────────

/** Tailwind class string for the 5-column grid used by all rows + header */
export const ROW_GRID =
  "grid grid-cols-[28px_1fr_100px_170px_100px] items-center";

/** Height of one row in pixels — must match TanStack Virtual `estimateSize` */
export const ROW_HEIGHT = 40;

// ─── Component ──────────────────────────────────────────────

interface FileRowProps {
  item: S3Item;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (item: S3Item) => void;
  onContextMenu?: (item: S3Item, e: React.MouseEvent) => void;
}

export default function FileRow({
  item,
  isSelected,
  isFocused,
  onSelect,
  onContextMenu,
}: FileRowProps) {
  // Resolve the icon component dynamically from lucide-react
  const iconName = toPascalCase(getFileIcon(item.name));
  const Icon =
    (icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName] ??
    icons.File;

  return (
    <div
      role="row"
      tabIndex={0}
      onClick={() => onSelect(item)}
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
        <Icon size={17} className="text-[var(--s3-window-muted)] opacity-60" />
      </div>

      {/* Name */}
      <span className="truncate text-sm text-[var(--s3-window-text)]">{item.name}</span>

      {/* Size */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right tabular-nums">
        {item.size != null ? formatFileSize(item.size) : "—"}
      </span>

      {/* Last modified */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right tabular-nums">
        {item.lastModified ? formatDate(item.lastModified) : "—"}
      </span>

      {/* Storage class */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right">
        {item.storageClass ?? "—"}
      </span>
    </div>
  );
}
