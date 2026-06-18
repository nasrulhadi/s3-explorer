import { useState } from "react";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Server,
  Database,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useConnectionStore } from "../../store/connectionStore";
import { useNavigationStore } from "../../store/navigationStore";
import { useS3 } from "../../hooks/useS3";
import type { S3Connection } from "../../types";

// ─── Sub-components ─────────────────────────────────────────

/** Single connection row — click to expand / collapse */
function ConnectionItem({
  connection,
  isActive,
  isExpanded,
  onSelect,
}: {
  connection: S3Connection;
  isActive: boolean;
  isExpanded: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left
        transition-colors duration-150
        ${isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/10"}
      `}
    >
      {isExpanded ? (
        <ChevronDown size={14} className="shrink-0" />
      ) : (
        <ChevronRight size={14} className="shrink-0" />
      )}
      <Server size={16} className="shrink-0" />
      <span className="truncate">{connection.name}</span>
    </button>
  );
}

/** Bucket list rendered under an expanded connection */
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
              ${isActive ? "bg-blue-600/40 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}
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
}

export default function Sidebar({ onAddConnection }: SidebarProps) {
  const connections = useConnectionStore((s) => s.connections);
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const setActiveConnection = useConnectionStore((s) => s.setActiveConnection);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleConnectionClick(id: string) {
    setActiveConnection(id);
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <aside className="w-64 h-full flex flex-col bg-[#1a1a2e] text-white select-none">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
        <h1 className="font-semibold text-sm tracking-wide">S3 Explorer</h1>
        {onAddConnection && (
          <button
            onClick={onAddConnection}
            title="Add Connection"
            className="
              p-1 rounded hover:bg-white/10 transition-colors
              text-gray-400 hover:text-white
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
          connections.map((conn) => (
            <div key={conn.id}>
              <ConnectionItem
                connection={conn}
                isActive={activeConnectionId === conn.id}
                isExpanded={expandedId === conn.id}
                onSelect={() => handleConnectionClick(conn.id)}
              />
              {expandedId === conn.id && <BucketList connectionId={conn.id} />}
            </div>
          ))
        )}
      </nav>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-white/10 text-xs text-gray-500">
        {connections.length} connection{connections.length !== 1 ? "s" : ""}
      </div>
    </aside>
  );
}
