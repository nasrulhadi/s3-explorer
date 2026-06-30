import { icons } from "lucide-react";
import type { S3Item, ColumnWidths } from "../../types";
import { getFileIcon, formatFileSize, formatDate } from "../../lib/utils";
import { useSettingsStore } from "../../store/settingsStore";

// ─── Helpers ────────────────────────────────────────────────

/** Convert a lucide icon slug ("file-text") to its PascalCase export name ("FileText") */
function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** Build grid-template-columns from persisted widths. Use -1 for auto (1fr). */
export function colGridStyle(w: ColumnWidths): React.CSSProperties {
  return {
    gridTemplateColumns: `28px ${w.name === -1 ? "1fr" : w.name + "px"} ${w.size}px ${w.modified}px ${w.class}px`,
  };
}

// ─── Shared layout constants ────────────────────────────────

/** Height of one row in pixels — must match TanStack Virtual `estimateSize` */
export const ROW_HEIGHT = 40;

// ─── Component ──────────────────────────────────────────────

interface FileRowProps {
  item: S3Item;
  isSelected: boolean;
  isFocused: boolean;
  isMoving?: boolean;
  onSelect: (item: S3Item) => void;
  onContextMenu?: (item: S3Item, e: React.MouseEvent) => void;
}

export default function FileRow({
  item,
  isSelected,
  isFocused,
  isMoving,
  onSelect,
  onContextMenu,
}: FileRowProps) {
  const columnWidths = useSettingsStore((s) => s.columnWidths);

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
      style={colGridStyle(columnWidths)}
      className={`
        grid items-center h-full px-3 gap-2 cursor-default select-none
        transition-colors duration-75
        ${isMoving ? "opacity-40 pointer-events-none" : ""}
        ${isSelected ? "bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)]" : "hover:bg-[var(--s3-window-hover-bg)]"}
        ${isFocused ? "ring-2 ring-inset ring-blue-400" : ""}
      `}
    >
      {/* Icon */}
      <div className="flex items-center justify-center">
        <Icon size={17} className="text-[var(--s3-window-muted)] opacity-60" />
      </div>

      {/* Name */}
      <span className="truncate text-sm text-[var(--s3-window-text)] pr-3">{item.name}</span>

      {/* Size */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right tabular-nums pr-3">
        {item.size != null ? formatFileSize(item.size) : "—"}
      </span>

      {/* Last modified */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right tabular-nums pr-3">
        {item.lastModified ? formatDate(item.lastModified) : "—"}
      </span>

      {/* Storage class */}
      <span className="text-xs text-[var(--s3-window-muted)] text-right pr-3">
        {item.storageClass ?? "—"}
      </span>
    </div>
  );
}
