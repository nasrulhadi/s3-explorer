import { useState, useMemo } from "react";
import {
  Plus,
  Database,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Settings,
  Search,
  X,
} from "lucide-react";
import { useConnectionStore } from "../../store/connectionStore";
import { useNavigationStore } from "../../store/navigationStore";
import { useS3 } from "../../hooks/useS3";
import type { S3Connection, S3Provider } from "../../types";

// ─── Provider labels ────────────────────────────────────────

const PROVIDER_LABELS: Record<S3Provider, string> = {
  aws: "AWS S3",
  minio: "MinIO",
  r2: "Cloudflare R2",
  b2: "Backblaze B2",
  custom: "Custom S3",
};

/** Build metadata label: provider · region (or bucket for R2/B2) */
function getMetadata(conn: S3Connection, activeBucket: string | null): string | null {
  const label = PROVIDER_LABELS[conn.provider];
  if (conn.provider === "r2" || conn.provider === "b2") {
    const bucket = conn.defaultBucket ?? (activeBucket || null);
    return bucket ? `${label} · ${bucket}` : label;
  }
  return conn.region ? `${label} · ${conn.region}` : label;
}

// ─── Connection Item ───────────────────────────────────────

function ConnectionItem({
  connection,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  activeBucket,
}: {
  connection: S3Connection;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  activeBucket: string | null;
}) {
  const metadata = getMetadata(connection, isActive ? activeBucket : null);

  return (
    <div
      className={`
        relative w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left
        transition-colors duration-150 group rounded-md border-l-[3px]
        ${isActive
          ? "border-l-[var(--s3-accent-active)] bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)]"
          : "border-l-transparent text-[var(--s3-sidebar-text)] hover:bg-[var(--s3-sidebar-item-hover)]"
        }
      `}
    >
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2.5 min-w-0"
      >
        <Database size={16} className="shrink-0 opacity-70" />
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate leading-snug font-medium">{connection.name}</div>
          {metadata && (
            <div
              className={`truncate text-[11px] leading-tight mt-0.5 ${
                isActive ? "text-[var(--s3-accent-text)]/60" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {metadata}
            </div>
          )}
        </div>
      </button>

      {/* Edit / Delete — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit connection"
          className={`p-1 rounded transition-colors ${
            isActive
              ? "text-[var(--s3-accent-text)]/70 hover:text-[var(--s3-accent-text)] hover:bg-black/10"
              : "text-gray-500 hover:text-[var(--s3-window-text)] hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete connection"
          className={`p-1 rounded transition-colors ${
            isActive
              ? "text-[var(--s3-accent-text)]/70 hover:text-red-600 hover:bg-red-500/20"
              : "text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
          }`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/** Bucket list rendered under an expanded connection (non-R2/B2 only) */
function BucketList({ connectionId }: { connectionId: string }) {
  const { listBuckets } = useS3();
  const { data, isLoading, error } = listBuckets(connectionId);

  const setBucket = useNavigationStore((s) => s.setBucket);
  const activeBucket = useNavigationStore((s) => s.bucket);
  const activeConnId = useNavigationStore((s) => s.connectionId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        Loading buckets…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 px-4 py-2.5 text-xs text-red-400">
        <AlertCircle size={12} className="mt-0.5 shrink-0" />
        <span className="truncate">{(error as Error).message}</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-4 py-2.5 text-xs text-gray-500 italic">
        No buckets found
      </div>
    );
  }

  return (
    <div className="ml-[3px] border-l border-gray-200 dark:border-gray-700">
      {data.map((bucket) => {
        const isActive =
          activeConnId === connectionId && activeBucket === bucket.name;

        return (
          <button
            key={bucket.key}
            onClick={() => setBucket(connectionId, bucket.name)}
            className={`
              w-full flex items-center gap-2 pl-9 pr-3 py-2 text-sm text-left
              transition-colors duration-150 border-l-[3px]
              ${isActive
                ? "border-l-[var(--s3-accent-active)] bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)]"
                : "border-l-transparent text-[var(--s3-sidebar-text)] hover:bg-[var(--s3-sidebar-item-hover)]"
              }
            `}
          >
            <Database size={13} className="shrink-0 opacity-60" />
            <span className="truncate">{bucket.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

interface SidebarProps {
  onAddConnection?: () => void;
  onEditConnection?: (id: string) => void;
  onDeleteConnection?: (id: string) => void;
  onOpenSettings?: () => void;
}

export default function Sidebar({
  onAddConnection,
  onEditConnection,
  onDeleteConnection,
  onOpenSettings,
}: SidebarProps) {
  const connections = useConnectionStore((s) => s.connections);
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const setActiveConnection = useConnectionStore((s) => s.setActiveConnection);
  const setConnectionId = useNavigationStore((s) => s.setConnectionId);
  const setBucket = useNavigationStore((s) => s.setBucket);
  const activeBucket = useNavigationStore((s) => s.bucket);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const hasConnections = connections.length > 0;

  // Filter connections by name (real-time)
  const filteredConnections = useMemo(() => {
    if (!filterQuery.trim()) return connections;
    const q = filterQuery.toLowerCase();
    return connections.filter((c) => c.name.toLowerCase().includes(q));
  }, [connections, filterQuery]);

  function handleConnectionClick(conn: S3Connection) {
    setActiveConnection(conn.id);

    const currentConnectionId = useNavigationStore.getState().connectionId;
    if (currentConnectionId !== conn.id) {
      setConnectionId(conn.id);
    }

    if (conn.provider === "r2" || conn.provider === "b2") {
      if (conn.defaultBucket) {
        setBucket(conn.id, conn.defaultBucket);
        setExpandedId(null);
        return;
      }
    }
    setExpandedId((prev) => (prev === conn.id ? null : conn.id));
  }

  return (
    <aside className="w-64 h-full flex flex-col bg-[var(--s3-sidebar-bg)] text-[var(--s3-sidebar-text)] select-none">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-baseline gap-1.5">
          <h1 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Connections
          </h1>
          {hasConnections && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {connections.length}
            </span>
          )}
        </div>
        <button
          onClick={() => hasConnections && setSearchOpen((v) => !v)}
          disabled={!hasConnections}
          title="Search connections"
          className={`
            p-1 rounded transition-colors
            ${searchOpen
              ? "text-[var(--s3-accent-text)] bg-[var(--s3-accent-base)]"
              : "text-[var(--s3-sidebar-text)] hover:text-[var(--s3-window-text)] hover:bg-[var(--s3-sidebar-item-hover)]"
            }
            ${!hasConnections && "opacity-40 cursor-not-allowed pointer-events-none"}
          `}
        >
          <Search size={16} />
        </button>
      </div>

      {/* ── Filter form (toggle show/hide via search icon) ── */}
      {searchOpen && hasConnections && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-[var(--s3-sidebar-item-hover)]">
            <Search size={13} className="shrink-0 text-gray-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter connections…"
              autoFocus
              className="flex-1 min-w-0 bg-transparent text-sm text-[var(--s3-sidebar-text)] placeholder-gray-400 dark:placeholder-gray-500 outline-none"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery("")}
                title="Clear"
                className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Connections list ────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2">
        {!hasConnections ? (
          /* ── Empty: no connections at all ── */
          <div className="px-4 py-10 text-center">
            <Database size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No connections yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Add one to get started
            </p>
          </div>
        ) : filteredConnections.length === 0 ? (
          /* ── Empty: filter has no match ── */
          <div className="px-4 py-10 text-center">
            <Search size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No connections match</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          /* ── Connection items ── */
          <div className="space-y-0.5 px-2">
            {filteredConnections.map((conn) => (
              <div key={conn.id}>
                <ConnectionItem
                  connection={conn}
                  isActive={activeConnectionId === conn.id}
                  activeBucket={activeBucket}
                  onSelect={() => handleConnectionClick(conn)}
                  onEdit={() => onEditConnection?.(conn.id)}
                  onDelete={() => onDeleteConnection?.(conn.id)}
                />
                {expandedId === conn.id && conn.provider !== "r2" && conn.provider !== "b2" && (
                  <BucketList connectionId={conn.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={onAddConnection}
          className="
            flex-1 flex items-center justify-center gap-1.5
            px-3 py-2 text-xs font-medium rounded-full
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            text-gray-700 dark:text-gray-200
            hover:bg-gray-50 dark:hover:bg-gray-700
            transition-colors cursor-pointer
          "
        >
          <Plus size={14} />
          Add Connection
        </button>
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="
            flex items-center justify-center
            w-9 h-9 rounded-full
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            text-gray-700 dark:text-gray-200
            hover:bg-gray-50 dark:hover:bg-gray-700
            transition-colors cursor-pointer
          "
        >
          <Settings size={14} />
        </button>
      </div>
    </aside>
  );
}
