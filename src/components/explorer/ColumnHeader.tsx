import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ROW_GRID } from "./FileRow";
import type { SortField, SortDirection } from "../../types";

interface ColumnHeaderProps {
  disabled?: boolean;
  sortField?: SortField;
  sortDir?: SortDirection;
  onToggleSort?: (field: SortField) => void;
}

export default function ColumnHeader({
  disabled,
  sortField,
  sortDir,
  onToggleSort,
}: ColumnHeaderProps) {
  if (disabled || !onToggleSort || !sortField || !sortDir) {
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
          <SortIcon field={f.key} sortField={sortField} sortDir={sortDir} />
        </button>
      ))}
    </div>
  );
}

/** Inline sort icon — needed for the sort header */
export function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDirection;
}) {
  if (sortField !== field) {
    return <ArrowUpDown size={13} className="text-gray-300" />;
  }
  return sortDir === "asc" ? (
    <ArrowUp size={13} className="text-[var(--s3-accent-text)]" />
  ) : (
    <ArrowDown size={13} className="text-[var(--s3-accent-text)]" />
  );
}
