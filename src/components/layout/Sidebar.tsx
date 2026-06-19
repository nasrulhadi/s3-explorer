import { useState } from "react";
import {
  Plus,
  Server,
  Database,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Settings,
} from "lucide-react";
import { useConnectionStore } from "../../store/connectionStore";
import { useNavigationStore } from "../../store/navigationStore";
import { useS3 } from "../../hooks/useS3";
import type { S3Connection } from "../../types";

// ─── Sub-components ─────────────────────────────────────────

/** Single connection row — icon + name + bucket badge */
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
  // Determine bucket to display
  const bucketLabel =
    connection.defaultBucket ??
    (isActive && activeBucket ? activeBucket : null);

  return (
    <div
      className={`
        w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left
        transition-colors duration-150 group rounded-md mx-0
        ${isActive
          ? "bg-blue-600 text-white"
          : "text-gray-300 bg-gray-800/50 dark:bg-gray-800/50 border border-gray-700 dark:border-gray-800 hover:bg-gray-800 dark:hover:bg-gray-800"
        }
      `}
    >
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 min-w-0"
      >
        <Server size={18} className="shrink-0" />
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate leading-snug">{connection.name}</div>
          {bucketLabel && (
            <div
              className={`
                truncate text-[11px] leading-tight
                ${isActive ? "text-white/60" : "text-gray-500"}
              `}
            >
              {bucketLabel}
            </div>
          )}
        </div>
      </button>

      {/* Edit / Delete — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit connection"
          className={`p-1 rounded hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors ${isActive ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete connection"
          className={`p-1 rounded hover:bg-red-500/30 transition-colors ${isActive ? "text-white/70 hover:text-red-300" : "text-gray-500 hover:text-red-400"}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/** Bucket list rendered under an expanded connection (non-R2 only) */
function BucketList({ connectionId }: { connectionId: string }) {
  const { listBuckets } = useS3();
  const { data, isLoading, error } = listBuckets(connectionId);

  const setBucket = useNavigationStore((s) => s.setBucket);
  const activeBucket = useNavigationStore((s) => s.bucket);
  const activeConnId = useNavigationStore((s) => s.connectionId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        Loading buckets…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 px-4 py-3 text-xs text-red-400">
        <AlertCircle size={12} className="mt-0.5 shrink-0" />
        <span className="truncate">{(error as Error).message}</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-gray-500 italic">
        No buckets found
      </div>
    );
  }

  return (
    <div>
      {data.map((bucket) => {
        const isActive =
          activeConnId === connectionId && activeBucket === bucket.name;

        return (
          <button
            key={bucket.key}
            onClick={() => setBucket(connectionId, bucket.name)}
            className={`
              w-full flex items-center gap-2 pl-10 pr-3 py-2 text-sm text-left
              transition-colors duration-150
              ${isActive ? "bg-blue-600/40 text-white" : "text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-gray-200"}
            `}
          >
            <Database size={14} className="shrink-0" />
            <span className="truncate">{bucket.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface SidebarProps {
  /** Fired when the user clicks the "+" add-connection button */
  onAddConnection?: () => void;
  /** Fired when the user clicks the edit button on a connection */
  onEditConnection?: (id: string) => void;
  /** Fired when the user clicks the delete button on a connection */
  onDeleteConnection?: (id: string) => void;
  /** Fired when the user clicks the settings gear icon */
  onOpenSettings?: () => void;
}

export default function Sidebar({ onAddConnection, onEditConnection, onDeleteConnection, onOpenSettings }: SidebarProps) {
  const connections = useConnectionStore((s) => s.connections);
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const setActiveConnection = useConnectionStore((s) => s.setActiveConnection);
  const setBucket = useNavigationStore((s) => s.setBucket);
  const activeBucket = useNavigationStore((s) => s.bucket);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleConnectionClick(conn: S3Connection) {
    setActiveConnection(conn.id);

    if (conn.provider === "r2" && conn.defaultBucket) {
      // R2 with defaultBucket → navigate directly to the bucket, no expand
      setBucket(conn.id, conn.defaultBucket);
      setExpandedId(null);
    } else {
      // Other providers → toggle expand to show bucket list
      setExpandedId((prev) => (prev === conn.id ? null : conn.id));
    }
  }

  return (
    <aside className="w-64 h-full flex flex-col bg-gray-900 dark:bg-gray-950 text-gray-100 select-none">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-700 dark:border-gray-800">
        <h1 className="font-semibold text-sm tracking-wide">S3 Explorer</h1>
        {onAddConnection && (
          <button
            onClick={onAddConnection}
            title="Add Connection"
            className="
              p-1 rounded hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors
              text-gray-400 hover:text-gray-100
            "
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* ── Connections list ────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2">
        {connections.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            <p>No connections yet.</p>
            {onAddConnection && (
              <button
                onClick={onAddConnection}
                className="mt-2 text-blue-400 hover:text-blue-300 text-xs underline"
              >
                Add your first connection
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 px-2">
            {connections.map((conn) => (
              <div key={conn.id}>
                <ConnectionItem
                  connection={conn}
                  isActive={activeConnectionId === conn.id}
                  activeBucket={activeBucket}
                  onSelect={() => handleConnectionClick(conn)}
                  onEdit={() => onEditConnection?.(conn.id)}
                  onDelete={() => onDeleteConnection?.(conn.id)}
                />
                {/* Only expand bucket list for non-R2 providers */}
                {expandedId === conn.id && conn.provider !== "r2" && (
                  <BucketList connectionId={conn.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-700 dark:border-gray-800">
        <span className="text-xs text-gray-500">
          {connections.length} connection{connections.length !== 1 ? "s" : ""}
        </span>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-1 rounded hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-300"
          >
            <Settings size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
