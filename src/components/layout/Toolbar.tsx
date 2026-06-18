import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Home,
  Upload,
  FolderPlus,
  RefreshCw,
  Search,
  ChevronRight,
} from "lucide-react";

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
}: ToolbarProps) {
  const [searchInput, setSearchInput] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

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

  // Buttons disabled when no bucket is selected
  const hasBucketSelected = !!connectionId && !!bucket;

  return (
    <div className="flex items-center gap-2 px-4 h-14 bg-white border-b border-gray-200 shrink-0">
      {/* ── Back button ──────────────────────────────────── */}
      <button
        onClick={onBack}
        disabled={history.length === 0}
        title="Back (Backspace)"
        className="
          p-1.5 rounded-md text-gray-600
          hover:bg-gray-100 transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed
        "
      >
        <ArrowLeft size={18} />
      </button>

      {/* ── Breadcrumb ───────────────────────────────────── */}
      <nav className="flex items-center gap-1 text-sm min-w-0">
        <button
          onClick={() => onNavigate("")}
          className={`
            shrink-0 p-1 rounded transition-colors
            ${bucket ? "text-gray-500 hover:text-blue-600 hover:bg-blue-50" : "text-gray-800"}
          `}
          title="Home"
        >
          <Home size={16} />
        </button>

        {bucket && (
          <>
            <ChevronRight size={14} className="shrink-0 text-gray-400" />
            <button
              onClick={() => onNavigate("")}
              className={`
                shrink-0 font-medium rounded px-1.5 py-0.5 transition-colors
                ${prefix === "" ? "text-gray-800" : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"}
              `}
            >
              {bucket}
            </button>
          </>
        )}

        {breadcrumbItems.map((item) => {
          const isLast = item.prefix === prefix;
          return (
            <span key={item.prefix} className="flex items-center gap-1">
              <ChevronRight size={14} className="shrink-0 text-gray-400" />
              <button
                onClick={() => onNavigate(item.prefix)}
                className={`
                  truncate max-w-[140px] rounded px-1.5 py-0.5 transition-colors
                  ${isLast
                    ? "text-gray-800 font-medium"
                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"}
                `}
                title={item.label}
              >
                {item.label}
              </button>
            </span>
          );
        })}
      </nav>

      {/* ── Spacer ───────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Search input ─────────────────────────────────── */}
      {hasBucketSelected && (
        <div className="relative w-52">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Filter files…"
            className="
              w-full pl-8 pr-3 py-1.5 text-sm
              border border-gray-200 rounded-md
              outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
              text-gray-700 placeholder-gray-400
              transition-all
            "
          />
        </div>
      )}

      {/* ── Action buttons ───────────────────────────────── */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUpload}
          disabled={!hasBucketSelected}
          title="Upload File (Ctrl+U)"
          className="
            flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md
            bg-blue-500 text-white
            hover:bg-blue-600 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <Upload size={15} />
          Upload
        </button>

        <button
          onClick={onNewFolder}
          disabled={!hasBucketSelected}
          title="New Folder"
          className="
            flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
            border border-gray-200 text-gray-600
            hover:bg-gray-50 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <FolderPlus size={15} />
          New Folder
        </button>

        <button
          onClick={onRefresh}
          disabled={!hasBucketSelected}
          title="Refresh (F5)"
          className="
            p-1.5 rounded-md text-gray-500
            hover:bg-gray-100 hover:text-gray-700 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
