import { useRef, useEffect, useState } from "react";
import {
  X,
  Trash2,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useTransferStore } from "../../store/transferStore";
import { useDownload } from "../../hooks/useDownload";
import { formatFileSize } from "../../lib/utils";
import type { Transfer } from "../../types";

// ─── Speed formatter ─────────────────────────────────────────

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return "";
  if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
  if (bytesPerSecond < 1024 * 1024)
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

// ─── Single transfer row ────────────────────────────────────

function TransferRow({ transfer }: { transfer: Transfer }) {
  const { cancelDownload } = useDownload();

  // Track bytes over time to compute live speed
  const [speed, setSpeed] = useState(0);
  const prevBytesRef = useRef(transfer.transferredBytes);
  const prevTimeRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = (now - prevTimeRef.current) / 1000; // seconds

    if (elapsed >= 0.4) {
      const delta = transfer.transferredBytes - prevBytesRef.current;
      setSpeed(delta / elapsed);
      prevBytesRef.current = transfer.transferredBytes;
      prevTimeRef.current = now;
    }
  }, [transfer.transferredBytes]);

  const isActive = transfer.status === "active";
  const isDone = transfer.status === "done";
  const isError = transfer.status === "error";

  const progress =
    transfer.totalBytes > 0
      ? Math.min((transfer.transferredBytes / transfer.totalBytes) * 100, 100)
      : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
      {/* ── Type icon ──────────────────────────────────── */}
      <div className="shrink-0">
        {transfer.type === "download" ? (
          <DownloadIcon size={15} className="text-blue-500" />
        ) : (
          <UploadIcon size={15} className="text-green-500" />
        )}
      </div>

      {/* ── Name + progress bar ─────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`truncate text-sm ${isError ? "text-red-600" : "text-gray-700"}`}
          >
            {transfer.fileName}
          </span>
          <span className="text-xs text-gray-400 ml-2 shrink-0 tabular-nums">
            {isDone && "Done"}
            {isError && (transfer.error ?? "Error")}
            {isActive && transfer.totalBytes > 0 && (
              <>
                {formatFileSize(transfer.transferredBytes)} /{" "}
                {formatFileSize(transfer.totalBytes)}
              </>
            )}
            {isActive && transfer.totalBytes === 0 && (
              <>{formatFileSize(transfer.transferredBytes)}</>
            )}
          </span>
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: transfer.totalBytes > 0 ? `${progress}%` : "30%" }}
            />
          </div>
        )}
        {isDone && (
          <div className="h-1.5 bg-green-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full w-full" />
          </div>
        )}
        {isError && (
          <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-400 rounded-full w-full" />
          </div>
        )}
      </div>

      {/* ── Speed ─────────────────────────────────────────── */}
      <div className="w-20 text-right shrink-0">
        {isActive && speed > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">
            {formatSpeed(speed)}
          </span>
        )}
        {isDone && (
          <CheckCircle2 size={15} className="text-green-500 inline-block" />
        )}
        {isError && (
          <XCircle size={15} className="text-red-400 inline-block" />
        )}
      </div>

      {/* ── Cancel / dismiss button ───────────────────────── */}
      <button
        onClick={() =>
          isActive
            ? cancelDownload(transfer.id)
            : useTransferStore.getState().removeTransfer(transfer.id)
        }
        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        title={isActive ? "Cancel" : "Remove"}
      >
        {isActive ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <X size={14} />
        )}
      </button>
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────

export default function TransferPanel() {
  const transfers = useTransferStore((s) => s.transfers);
  const clearCompleted = useTransferStore((s) => s.clearCompleted);
  const [collapsed, setCollapsed] = useState(false);

  // Don't render anything when there are no transfers
  if (transfers.length === 0) return null;

  const activeCount = transfers.filter((t) => t.status === "active").length;
  const completedCount = transfers.filter(
    (t) => t.status === "done" || t.status === "error",
  ).length;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-11 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          Transfers
          {activeCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
              {activeCount}
            </span>
          )}
        </span>

        <div className="flex items-center gap-1">
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              title="Clear completed"
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Transfer list ───────────────────────────────────── */}
      {!collapsed && (
        <div className="max-h-60 overflow-y-auto">
          {transfers.map((t) => (
            <TransferRow key={t.id} transfer={t} />
          ))}
        </div>
      )}
    </div>
  );
}
