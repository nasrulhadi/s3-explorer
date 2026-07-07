import { useMemo, useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  ArrowLeft,
  Home,
  Upload,
  FolderPlus,
  RefreshCw,
  Search,
  ChevronRight,
  MoreHorizontal,
  Power,
  X,
} from "lucide-react";
import { useSettingsStore } from "../../store/settingsStore";

// ─── Types ──────────────────────────────────────────────────

interface ToolbarProps {
  connectionId: string | null;
  bucket: string | null;
  prefix: string;
  history: string[];

  onBack: () => void;
  onNavigate: (prefix: string) => void;
  onRefresh: () => void;
  onUpload?: () => void;
  onNewFolder?: () => void;
  onSearchChange?: (query: string) => void;
  onDisconnect?: () => void;
}

// ─── Component ──────────────────────────────────────────────

export default function Toolbar({
  connectionId,
  bucket,
  prefix,
  history,
  onBack,
  onNavigate,
  onRefresh,
  onUpload,
  onNewFolder,
  onSearchChange,
  onDisconnect,
}: ToolbarProps) {
  const [searchInput, setSearchInput] = useState("");
  const [maximized, setMaximized] = useState(false);

  // Settings
  const showBreadcrumbs = useSettingsStore((s) => s.showBreadcrumbs);
  const showFilter = useSettingsStore((s) => s.showFilter);
  const showUpload = useSettingsStore((s) => s.showUpload);
  const showNewFolder = useSettingsStore((s) => s.showNewFolder);
  const showReload = useSettingsStore((s) => s.showReload);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  // Track window maximize state
  useEffect(() => {
    let destroyed = false;
    const win = getCurrentWindow();

    win.isMaximized()
      .then((val) => { if (!destroyed) setMaximized(val); })
      .catch(() => {});

    let unlistenFn: (() => void) | null = null;
    win.onResized(() => {
      win.isMaximized()
        .then((val) => { if (!destroyed) setMaximized(val); })
        .catch(() => {});
    }).then((fn) => { unlistenFn = fn; });

    return () => {
      destroyed = true;
      unlistenFn?.();
    };
  }, []);

  // Build breadcrumb segments from the current prefix
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; prefix: string }[] = [];

    if (!bucket) return items; // no bucket → no breadcrumb beyond Home

    const parts = prefix.split("/").filter(Boolean);
    let accumulated = "";

    for (const part of parts) {
      accumulated += `${part}/`;
      items.push({ label: part, prefix: accumulated });
    }

    return items;
  }, [bucket, prefix]);

  // Truncate breadcrumb: show max 3 last folders, collapse earlier ones into "…"
  const MAX_VISIBLE = 1;
  const collapsedCount = Math.max(0, breadcrumbItems.length - MAX_VISIBLE);
  const visibleItems = collapsedCount > 0 ? breadcrumbItems.slice(collapsedCount) : breadcrumbItems;
  const hiddenItems = collapsedCount > 0 ? breadcrumbItems.slice(0, collapsedCount) : [];

  // Collapsed dropdown state
  const [showCollapsed, setShowCollapsed] = useState(false);

  // Buttons disabled when no bucket is selected
  const hasBucketSelected = !!connectionId && !!bucket;

  return (
    <div className="flex items-center gap-2 px-4 h-14 bg-[var(--s3-window-bg)] border-b border-[var(--s3-toolbar-border)] shrink-0 rounded-tl-xl">
      {/* ── Back button ──────────────────────────────────── */}
      <button
        onClick={onBack}
        disabled={history.length === 0}
        title="Back (Backspace)"
        className="
          p-1.5 rounded-md text-[var(--s3-window-muted)]
          hover:bg-[var(--s3-window-hover-bg)] transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed
        "
      >
        <ArrowLeft size={18} />
      </button>

      {/* ── Breadcrumb ───────────────────────────────────── */}
      {showBreadcrumbs && (
      <nav className="flex items-center gap-1 text-sm min-w-0">
        <button
          onClick={() => onNavigate("")}
          className={`
            shrink-0 p-1 rounded transition-colors
            ${bucket ? "text-[var(--s3-window-muted)] hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)]" : "text-[var(--s3-window-text)]"}
          `}
          title="Home"
        >
          <Home size={16} />
        </button>

        {bucket && (
          <>
            <ChevronRight size={14} className="shrink-0 text-[var(--s3-window-muted)] opacity-50" />
            <button
              onClick={() => onNavigate("")}
              className={`
                shrink-0 font-medium rounded px-1.5 py-0.5 transition-colors
                ${prefix === "" ? "text-[var(--s3-window-text)]" : "text-[var(--s3-window-muted)] hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)]"}
              `}
            >
              {bucket}
            </button>
          </>
        )}

        {/* Collapsed "…" dropdown (when more than MAX_VISIBLE folders) */}
        {hiddenItems.length > 0 && (
          <>
            <ChevronRight size={14} className="shrink-0 text-[var(--s3-window-muted)] opacity-50" />
            <div className="relative flex items-center">
              <button
                onClick={() => setShowCollapsed((v) => !v)}
                className="rounded px-1 py-0.5 text-[var(--s3-window-muted)] hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)] transition-colors"
                title="Show hidden folders"
              >
                <MoreHorizontal size={16} />
              </button>
              {showCollapsed && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowCollapsed(false)} />
                  <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--s3-window-bg)] border border-[var(--s3-window-border)] rounded-lg shadow-lg py-1 min-w-[160px]">
                    {hiddenItems.map((item) => (
                      <button
                        key={item.prefix}
                        onClick={() => {
                          onNavigate(item.prefix);
                          setShowCollapsed(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-[var(--s3-window-text)] hover:bg-[var(--s3-accent-base)] hover:text-[var(--s3-accent-text)] transition-colors truncate"
                        title={item.label}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Visible breadcrumb items (last MAX_VISIBLE) */}
        {visibleItems.map((item) => {
          const isLast = item.prefix === prefix;
          const displayLabel = isLast && !maximized && item.label.length > 20
            ? item.label.slice(0, 19) + "…"
            : item.label;
          return (
            <span key={item.prefix} className="flex items-center gap-1">
              <ChevronRight size={14} className="shrink-0 text-[var(--s3-window-muted)] opacity-50" />
              <button
                onClick={() => onNavigate(item.prefix)}
                className={`
                  rounded px-1.5 py-0.5 transition-colors
                  ${isLast
                    ? "text-[var(--s3-window-text)] font-medium"
                    : "truncate max-w-[140px] text-[var(--s3-window-muted)] hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)]"}
                `}
                title={item.label}
              >
                {displayLabel}
              </button>
            </span>
          );
        })}
      </nav>
      )}

      {/* ── Spacer ───────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Search input ─────────────────────────────────── */}
      {showFilter && hasBucketSelected && (
        <div className="relative w-36">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--s3-window-muted)] opacity-50 pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Filter…"
            className="
              w-full pl-8 pr-8 py-1.5 text-sm
              border border-[var(--s3-window-border)] rounded-md
              outline-none focus:border-zinc-500
              text-[var(--s3-window-text)] placeholder-[var(--s3-window-muted)] placeholder:opacity-60
              bg-[var(--s3-window-bg)]
              transition-all
            "
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--s3-window-muted)] hover:text-[var(--s3-window-text)] hover:bg-[var(--s3-window-hover-bg)] transition-colors"
              title="Clear filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ── Action buttons ───────────────────────────────── */}
      <div className="flex items-center gap-1">
        {showUpload && (
        <button
          onClick={onUpload}
          disabled={!hasBucketSelected}
          title="Upload File (Ctrl+U)"
          className="
            flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md
            bg-[var(--s3-accent-active)] text-white
            hover:bg-[var(--s3-accent-hover)] transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <Upload size={15} />
          Upload
        </button>
        )}

        {showNewFolder && (
        <button
          onClick={onNewFolder}
          disabled={!hasBucketSelected}
          title="New Folder"
          className="
            flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
            border border-[var(--s3-window-border)] text-[var(--s3-window-muted)]
            hover:bg-[var(--s3-window-hover-bg)] transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <FolderPlus size={15} />
          New Folder
        </button>
        )}

        {showReload && (
        <button
          onClick={onRefresh}
          disabled={!hasBucketSelected}
          title="Refresh (F5)"
          className="
            p-1.5 rounded-md text-[var(--s3-window-muted)]
            hover:bg-[var(--s3-window-hover-bg)] hover:text-[var(--s3-window-text)] transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <RefreshCw size={16} />
        </button>
        )}

        {onDisconnect && (
        <button
          onClick={onDisconnect}
          disabled={!hasBucketSelected}
          title="Disconnect"
          className="
            p-1.5 rounded-md text-[var(--s3-window-muted)]
            hover:bg-[var(--s3-danger-light)] hover:text-[var(--s3-danger)] transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <Power size={16} />
        </button>
        )}
      </div>
    </div>
  );
}
