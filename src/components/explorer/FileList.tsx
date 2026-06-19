import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  FileX,
  AlertCircle,
} from "lucide-react";
import { useS3 } from "../../hooks/useS3";
import { useNavigationStore } from "../../store/navigationStore";
import type { S3Item, SortField, SortDirection } from "../../types";
import FileRow, { ROW_HEIGHT, ROW_GRID } from "./FileRow";
import FolderRow from "./FolderRow";
import ItemContextMenu from "./ContextMenu";

// ─── Constants ──────────────────────────────────────────────

const SKELETON_COUNT = 8;

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
}

export default function FileList({ filterQuery }: FileListProps) {
  const { listObjects } = useS3();

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

  const parentRef = useRef<HTMLDivElement>(null);

  // ── Data query ─────────────────────────────────────────────
  const { data, isLoading, isFetching, isError, error } = listObjects(
    connectionId,
    bucket,
    prefix,
  );

  // Reset selection when navigating to a different folder
  useEffect(() => {
    setSelectedKeys(new Set());
    setFocusIndex(-1);
  }, [connectionId, bucket, prefix]);

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

  // ── Sort header helper ─────────────────────────────────────
  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-gray-300" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={13} className="text-blue-500" />
    ) : (
      <ArrowDown size={13} className="text-blue-500" />
    );
  }

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  // ── Loading (first load or refetch) ───────────────────────
  if (isLoading || isFetching) {
    return (
      <div className="h-full flex flex-col bg-[var(--s3-window-bg)] overflow-hidden">
        <ColumnHeader disabled />
        <div className="flex-1">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[var(--s3-window-bg)]">
        <AlertCircle size={40} className="text-[var(--s3-danger)] mb-3" />
        <p className="text-sm font-medium text-[var(--s3-danger)]">
          Failed to load contents
        </p>
        <p className="text-xs text-[var(--s3-window-muted)] mt-1 max-w-xs">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────
  if (displayedItems.length === 0) {
    return (
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
    );
  }

  // ── Normal: virtualized list ───────────────────────────────
  return (
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
              <ItemContextMenu item={item}>
                <div
                  key={item.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="border-b border-[var(--s3-window-border)]"
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
              </ItemContextMenu>
            );
          })}
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-8 border-t border-[var(--s3-statusbar-border)] bg-[var(--s3-statusbar-bg)] text-xs text-[var(--s3-window-muted)] shrink-0">
        <span>
          {displayedItems.length} item{displayedItems.length !== 1 ? "s" : ""}
          {filterQuery ? ` (filtered)` : ""}
        </span>
        {selectedKeys.size > 0 && (
          <span className="text-[var(--s3-accent)] font-medium">
            {selectedKeys.size} selected
          </span>
        )}
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
