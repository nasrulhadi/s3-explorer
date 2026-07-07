import { useRef, useEffect, useState } from "react";
import {
  X,
  Trash2,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ArrowRightLeft,
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
  const removeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Auto-remove completed entries after 4 seconds (all types: upload, download, move)
  useEffect(() => {
    if (transfer.status === "done") {
      removeRef.current = setTimeout(() => {
        useTransferStore.getState().removeTransfer(transfer.id);
      }, 4000);
      return () => {
        if (removeRef.current) clearTimeout(removeRef.current);
      };
    }
  }, [transfer.status, transfer.id]);

  const isActive = transfer.status === "active";
  const isDone = transfer.status === "done";
  const isError = transfer.status === "error";
  const isMove = transfer.type === "move";

  const progress =
    transfer.totalBytes > 0
      ? Math.min((transfer.transferredBytes / transfer.totalBytes) * 100, 100)
      : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* ── Type icon ──────────────────────────────────── */}
      <div className="shrink-0">
        {transfer.type === "download" ? (
          <DownloadIcon size={15} className="text-blue-500" />
        ) : transfer.type === "move" ? (
          <ArrowRightLeft size={15} className="text-amber-500" />
        ) : (
          <UploadIcon size={15} className="text-green-500" />
        )}
      </div>

      {/* ── Name + progress bar ─────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`truncate text-sm ${isError ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-200"}`}
          >
            {transfer.fileName}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0 tabular-nums">
            {isDone && (isMove ? "Done" : "Done")}
            {isError && (transfer.error ?? "Error")}
            {isActive && isMove && "Moving..."}
            {isActive && !isMove && transfer.totalBytes > 0 && (
              <>
                {formatFileSize(transfer.transferredBytes)} /{" "}
                {formatFileSize(transfer.totalBytes)}
              </>
            )}
            {isActive && !isMove && transfer.totalBytes === 0 && (
              <>{formatFileSize(transfer.transferredBytes)}</>
            )}
          </span>
        </div>

        {/* Progress bar */}
        {isActive && isMove && (
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full animate-pulse w-2/3" />
          </div>
        )}
        {isActive && !isMove && (
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--s3-accent-active)] rounded-full transition-all duration-200"
              style={{ width: transfer.totalBytes > 0 ? `${progress}%` : "30%" }}
            />
          </div>
        )}
        {isDone && (
          <div className="h-1.5 bg-green-200 dark:bg-green-900/50 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full w-full" />
          </div>
        )}
        {isError && (
          <div className="h-1.5 bg-red-100 dark:bg-red-900/50 rounded-full overflow-hidden">
            <div className="h-full bg-red-400 rounded-full w-full" />
          </div>
        )}
      </div>

      {/* ── Speed ─────────────────────────────────────────── */}
      <div className="w-20 text-right shrink-0">
        {isActive && !isMove && speed > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
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
        onClick={() => {
          if (removeRef.current) clearTimeout(removeRef.current);
          isActive
            ? cancelDownload(transfer.id)
            : useTransferStore.getState().removeTransfer(transfer.id);
        }}
        className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
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
    <div className="fixed bottom-10 right-4 w-96 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 z-40 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-11 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Transfers
          {activeCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)] rounded-full">
              {activeCount}
            </span>
          )}
        </span>

        <div className="flex items-center gap-1">
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              title="Clear completed"
              className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
            className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
