import { useState } from "react";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import type { S3Connection } from "../../types";
import { useConnectionStore } from "../../store/connectionStore";

// ─── Provider label helper ──────────────────────────────────

function providerLabel(p: string) {
  return p === "r2"
    ? "Cloudflare R2"
    : p === "b2"
    ? "Backblaze B2"
    : p === "minio"
    ? "MinIO"
    : p === "s3"
    ? "AWS S3"
    : "Custom S3";
}

// ─── Types ──────────────────────────────────────────────────

interface ImportPreview {
  connection: S3Connection;
  action: "new" | "update" | "skip";
  /** For update: which existing connection name is being overwritten */
  existingName?: string;
}

interface Props {
  /** Parsed connections ready to import */
  preview: ImportPreview[];
  /** Whether imported data will be saved into an encrypted local vault */
  isMasterPasswordEnabled?: boolean;
  /** Called when user wants to protect imported connections after import */
  onEnableMasterPassword?: () => void;
  /** Called when user cancels (before or after import) */
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────

export default function ImportConnectionsModal({
  preview,
  isMasterPasswordEnabled = false,
  onEnableMasterPassword,
  onClose,
}: Props) {
  const [result, setResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);

  const newCount = preview.filter((p) => p.action === "new").length;
  const updateCount = preview.filter((p) => p.action === "update").length;
  const skipCount = preview.filter((p) => p.action === "skip").length;

  const handleImport = () => {
    const imported = preview.map((p) => p.connection);
    const res = useConnectionStore.getState().importConnections(imported);
    setResult(res);
  };

  // ── Phase 2: Result report ────────────────────────────────
  if (result) {
    const total = result.added + result.updated + result.skipped;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Import Complete
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {total} connection{total !== 1 ? "s" : ""} processed
            </p>
          </div>

          {/* Result stats */}
          <div className="px-5 pb-6 space-y-2">
            {result.added > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Plus size={14} />
                <span>{result.added} new connection{result.added !== 1 ? "s" : ""} added</span>
              </div>
            )}
            {result.updated > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <RefreshCw size={14} />
                <span>{result.updated} connection{result.updated !== 1 ? "s" : ""} updated</span>
              </div>
            )}
            {result.skipped > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <AlertCircle size={14} />
                <span>{result.skipped} duplicate{result.skipped !== 1 ? "s" : ""} skipped</span>
              </div>
            )}
          </div>

          {!isMasterPasswordEnabled && result.added + result.updated > 0 && (
            <div className="mx-5 mb-4 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                Imported connections are stored without master password protection. Enable master password to encrypt them on this device.
              </p>
              {onEnableMasterPassword && (
                <button
                  onClick={() => { onClose(); onEnableMasterPassword(); }}
                  className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors cursor-pointer"
                >
                  Enable Master Password
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-5 pb-5">
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium rounded-lg bg-[var(--s3-accent-active)] text-white hover:bg-[var(--s3-accent-hover)] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 1: Preview & confirm ─────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Import Connections
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {preview.length} connection{preview.length !== 1 ? "s" : ""} found in file
          </p>
        </div>

        {/* Summary badges */}
        <div className="px-5 pb-1 flex items-center gap-3 text-xs">
          {newCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <Plus size={10} /> {newCount} new
            </span>
          )}
          {updateCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <RefreshCw size={10} /> {updateCount} update{updateCount !== 1 ? "s" : ""}
            </span>
          )}
          {skipCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <AlertCircle size={10} /> {skipCount} skipped
            </span>
          )}
        </div>

        {/* Connection list */}
        <div className="px-5 py-3 max-h-60 overflow-y-auto space-y-1.5">
          {preview.map((p) => {
            const badge =
              p.action === "new"
                ? { label: "Insert", cls: "border-green-500 text-green-600 dark:text-green-400" }
                : p.action === "update"
                ? { label: "Update", cls: "border-amber-500 text-amber-600 dark:text-amber-400" }
                : { label: "Skip", cls: "border-gray-400 text-gray-500 dark:text-gray-400" };
            return (
              <div
                key={p.connection.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm"
              >
                {/* Icon */}
                {/* Label */}
                <div className="min-w-0 flex-1">
                  <span className="text-gray-800 dark:text-gray-200 truncate block">
                    {p.connection.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {providerLabel(p.connection.provider)}
                    {p.action === "update" && p.existingName
                      ? ` — replaces "${p.existingName}"`
                      : p.action === "skip"
                      ? " — duplicate"
                      : ""}
                  </span>
                </div>
                {/* Status badge */}
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-[var(--s3-accent-active)] text-white hover:bg-[var(--s3-accent-hover)] transition-colors cursor-pointer"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
