import { useCallback, useRef, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SortField, SortDirection, ColumnWidths } from "../../types";
import { colGridStyle } from "./FileRow";
import { useT } from "../../i18n";
import { useSettingsStore } from "../../store/settingsStore";

type ResizeTarget = keyof ColumnWidths;

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
  const t = useT();
  const columnWidths = useSettingsStore((s) => s.columnWidths);
  const labelMap: Record<string, string> = { name: t.common.name, size: t.common.size, modified: t.common.modified, class: t.common.class };

  const [resizing, setResizing] = useState<ResizeTarget | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const nameRef = useRef<HTMLButtonElement>(null);
  const didDragRef = useRef(false);

  const startResize = useCallback(
    (field: ResizeTarget, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      didDragRef.current = false;
      setResizing(field);
      startXRef.current = e.clientX;

      const store = useSettingsStore.getState();
      let baseWidth = store.columnWidths[field];

      if (baseWidth === -1 && field === "name" && nameRef.current) {
        baseWidth = nameRef.current.offsetWidth;
      }

      startWidthRef.current = Math.max(baseWidth, 40);

      const onMouseMove = (me: MouseEvent) => {
        const delta = me.clientX - startXRef.current;
        if (Math.abs(delta) > 3) didDragRef.current = true;
        const newWidth = Math.round(Math.max(40, startWidthRef.current + delta));
        const latest = useSettingsStore.getState().columnWidths;
        useSettingsStore.getState().setColumnWidths({ ...latest, [field]: newWidth });
      };

      const onMouseUp = () => {
        setResizing(null);
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [],
  );

  const fields: { key: SortField; label: string; resizeKey?: ResizeTarget }[] = [
    { key: "name", label: "Name", resizeKey: "name" },
    { key: "size", label: "Size", resizeKey: "size" },
    { key: "lastModified", label: "Modified", resizeKey: "modified" },
    { key: "storageClass", label: "Class" },
  ];

  const BASE = "grid items-center h-10 px-3 gap-2 border-b border-[var(--s3-window-border)] bg-[var(--s3-statusbar-bg)] text-xs font-medium text-[var(--s3-window-muted)] shrink-0 select-none";

  const BORDER = "border-r border-[var(--s3-window-border)]/60";

  return (
    <div style={colGridStyle(columnWidths)} className={BASE}>
      <span />
      {fields.map((f, idx) => {
        const isLast = idx === fields.length - 1;
        const borderCls = isLast ? "" : BORDER;
        const alignCls = f.key === "name" ? "" : "justify-end";

        if (disabled || !onToggleSort || !sortField || !sortDir) {
          return (
            <span key={f.key} className={`truncate ${borderCls} pr-2 ${alignCls}`}>
              {labelMap[f.key] || f.label}
            </span>
          );
        }

        return (
          <button
            key={f.key}
            ref={f.key === "name" ? nameRef : undefined}
            onClick={() => {
              const wasDrag = didDragRef.current;
              didDragRef.current = false;
              if (!wasDrag) onToggleSort!(f.key);
            }}
            className={`
              relative flex items-center gap-1 min-w-0 h-full truncate pr-2
              ${borderCls} ${alignCls}
              hover:text-[var(--s3-window-text)] transition-colors
            `}
          >
            <span className="truncate">{labelMap[f.key] || f.label}</span>
            <SortIcon field={f.key} sortField={sortField!} sortDir={sortDir!} />
            {f.resizeKey && (
              <div
                className={`
                  absolute right-[-5px] top-[-2px] bottom-[-2px] w-[10px] cursor-col-resize z-10
                  ${resizing === f.resizeKey
                    ? "after:absolute after:right-[4px] after:top-0 after:bottom-0 after:w-[2px] after:bg-[var(--s3-accent-base)]"
                    : "hover:after:absolute hover:after:right-[4px] hover:after:top-0 hover:after:bottom-0 hover:after:w-[2px] hover:after:bg-[var(--s3-window-border)]"
                  }
                `}
                onMouseDown={(e) => startResize(f.resizeKey!, e)}
              />
            )}
          </button>
        );
      })}
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
    return <ArrowUpDown size={13} className="text-gray-300 shrink-0" />;
  }
  return sortDir === "asc" ? (
    <ArrowUp size={13} className="text-[var(--s3-accent-text)] shrink-0" />
  ) : (
    <ArrowDown size={13} className="text-[var(--s3-accent-text)] shrink-0" />
  );
}
