import { useState, useMemo, useRef } from "react";
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
  Circle,
  Lock,
} from "lucide-react";
import { useConnectionStore } from "../../store/connectionStore";
import { useNavigationStore } from "../../store/navigationStore";
import { useSecurityStore } from "../../store/securityStore";
import { useS3 } from "../../hooks/useS3";
import { useT } from "../../i18n";
import type { S3Connection, S3Provider } from "../../types";

// ─── Connection Item ───────────────────────────────────────

function ConnectionItem({
  connection,
  isActive,
  isOpened,
  onSelect,
  onEdit,
  onDelete,
}: {
  connection: S3Connection;
  isActive: boolean;
  isOpened: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const providerLabel = t.providers[connection.provider as S3Provider];
  return (
      <div
        className={`
          relative w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left
          transition-colors duration-150 group rounded-xl
          ${isActive
            ? "bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)]"
            : "text-[var(--s3-sidebar-text)] hover:bg-[var(--s3-sidebar-item-hover)]"
          }
        `}
      >
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2.5 min-w-0"
      >
        {connection.emoji ? (
          <span className="shrink-0 text-xl leading-none w-5 flex items-center justify-center">
            {connection.emoji}
          </span>
        ) : (
          <Database size={20} className="shrink-0 opacity-70" />
        )}
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate leading-snug font-medium">{connection.name}</div>
          <div
            className={`truncate text-[11px] leading-tight mt-0.5 ${
              isActive ? "text-[var(--s3-accent-text)]/60" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {providerLabel}
          </div>
        </div>
      </button>

      {/* Edit / Delete — visible on hover, dot always at far right */}
      <div className="flex items-center gap-1.5 w-14 h-7 justify-end shrink-0 self-center">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title={t.sidebar.editConnectionTitle}
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
            title={t.sidebar.deleteConnectionTitle}
            className={`p-1 rounded transition-colors ${
              isActive
                ? "text-[var(--s3-accent-text)]/70 hover:text-red-600 hover:bg-red-500/20"
                : "text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
            }`}
          >
            <Trash2 size={13} />
          </button>
        </div>
        {/* Dot — always occupies same width, visible or invisible */}
        {isOpened ? (
          <Circle size={6} className="text-emerald-400/70" fill="currentColor" />
        ) : (
          <span className="w-1" />
        )}
      </div>
    </div>
  );
}

/** Bucket list rendered under an expanded connection (non-R2/B2 only) */
function BucketList({ connectionId }: { connectionId: string }) {
  const t = useT();
  const { listBuckets } = useS3();
  const { data, isLoading, error } = listBuckets(connectionId);

  const setBucket = useNavigationStore((s) => s.setBucket);
  const activeBucket = useNavigationStore((s) => s.bucket);
  const activeConnId = useNavigationStore((s) => s.connectionId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        {t.sidebar.loadingBuckets}
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
        {t.sidebar.noBuckets}
      </div>
    );
  }

  return (
    <div className="ml-[3px] border-l border-gray-200/60 dark:border-zinc-700/60">
      {data.map((bucket) => {
        const isActive =
          activeConnId === connectionId && activeBucket === bucket.name;

        return (
          <button
            key={bucket.key}
            onClick={() => setBucket(connectionId, bucket.name)}
            className={`
              w-full flex items-center gap-2 pl-9 pr-3 py-2 text-sm text-left rounded-r-lg
              transition-all duration-150 border-l-[3px] -ml-[1px]
              ${isActive
                ? "border-l-[var(--s3-accent-active)] bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)]"
                : "border-l-transparent text-[var(--s3-sidebar-text)] hover:bg-[var(--s3-sidebar-item-hover)] hover:border-l-gray-300 dark:hover:border-l-zinc-500"
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
  onSelectConnection?: () => void;
}

export default function Sidebar({
  onAddConnection,
  onEditConnection,
  onDeleteConnection,
  onOpenSettings,
  onSelectConnection,
}: SidebarProps) {
  const t = useT();
  const connections = useConnectionStore((s) => s.connections);
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const setActiveConnection = useConnectionStore((s) => s.setActiveConnection);
  const setConnectionId = useNavigationStore((s) => s.setConnectionId);
  const setBucket = useNavigationStore((s) => s.setBucket);
  const isMasterPasswordEnabled = useSecurityStore((s) => s.isMasterPasswordEnabled);
  const lock = useSecurityStore((s) => s.lock);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const openedRef = useRef<Set<string>>(new Set());
  const lastActiveId = useRef<string | null>(null);

  // When a connection is deleted from store → remove its dot
  // When a connection is disconnected (activeConnectionId → null) → remove its dot
  // This sync runs before every render.
  const activeIds = new Set(connections.map((c) => c.id));
  for (const id of openedRef.current) {
    if (!activeIds.has(id)) {
      openedRef.current.delete(id);
    }
  }
  if (activeConnectionId === null && lastActiveId.current) {
    openedRef.current.delete(lastActiveId.current);
    lastActiveId.current = null;
  }
  if (activeConnectionId) {
    lastActiveId.current = activeConnectionId;
  }

  const hasConnections = connections.length > 0;

  // Filter connections by name (real-time)
  const filteredConnections = useMemo(() => {
    if (!filterQuery.trim()) return connections;
    const q = filterQuery.toLowerCase();
    return connections.filter((c) => c.name.toLowerCase().includes(q));
  }, [connections, filterQuery]);

  function handleConnectionClick(conn: S3Connection) {
    onSelectConnection?.();
    setActiveConnection(conn.id);
    openedRef.current.add(conn.id);
    lastActiveId.current = conn.id;

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
    <aside className="w-[268px] h-full flex flex-col bg-[var(--s3-sidebar-bg)] text-[var(--s3-sidebar-text)] select-none">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-baseline gap-1.5">
          <h1 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {t.sidebar.header}
          </h1>
          {hasConnections && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {filteredConnections.length}
            </span>
          )}
        </div>
        <button
          onClick={() => hasConnections && setSearchOpen((v) => !v)}
          disabled={!hasConnections}
          title={t.sidebar.searchConnectionsTitle}
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
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <Search size={12} className="shrink-0 text-gray-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={t.sidebar.searchPlaceholder}
              autoFocus
              className="flex-1 min-w-0 bg-transparent text-xs text-[var(--s3-sidebar-text)] placeholder-gray-300 dark:placeholder-gray-600 outline-none"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery("")}
                title={t.sidebar.clearTitle}
                className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Connections list ────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto pb-2">
        {!hasConnections ? (
          /* ── Empty: no connections at all ── */
          <div className="px-3 py-2">
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 px-3 py-4 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">{t.sidebar.noConnections}</p>
            </div>
          </div>
        ) : filteredConnections.length === 0 ? (
          /* ── Empty: filter has no match ── */
          <div className="px-4 py-10 text-center">
            <Search size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.sidebar.noMatch}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t.sidebar.noMatchHint}
            </p>
          </div>
        ) : (
          /* ── Connection items ── */
          <div className="space-y-1 px-2">
            {filteredConnections.map((conn) => (
              <div key={conn.id}>
                <ConnectionItem
                  connection={conn}
                  isActive={activeConnectionId === conn.id}
                  isOpened={openedRef.current.has(conn.id)}
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
            bg-white dark:bg-zinc-800
            border border-gray-200 dark:border-zinc-700
            text-gray-700 dark:text-gray-200
            hover:bg-gray-50 dark:hover:bg-zinc-700
            transition-colors cursor-pointer
          "
        >
          <Plus size={14} />
          {t.sidebar.addConnection}
        </button>
        <button
          onClick={onOpenSettings}
          title={t.sidebar.settings}
          className="
            flex items-center justify-center
            w-9 h-9 rounded-full
            bg-white dark:bg-zinc-800
            border border-gray-200 dark:border-zinc-700
            text-gray-700 dark:text-gray-200
            hover:bg-gray-50 dark:hover:bg-zinc-700
            transition-colors cursor-pointer
          "
        >
          <Settings size={14} />
        </button>
        {isMasterPasswordEnabled && (
          <button
            onClick={lock}
            title={t.sidebar.lockApp}
            className="
              flex items-center justify-center
              w-9 h-9 rounded-full
              bg-white dark:bg-zinc-800
              border border-gray-200 dark:border-zinc-700
              text-gray-700 dark:text-gray-200
              hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20
              transition-colors cursor-pointer
            "
          >
            <Lock size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
