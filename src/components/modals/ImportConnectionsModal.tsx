import { useState } from "react";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import { useT } from "../../i18n";
import type { S3Connection } from "../../types";
import { useConnectionStore } from "../../store/connectionStore";

// ─── Types ──────────────────────────────────────────────────

interface ImportPreview {
  connection: S3Connection;
  action: "new" | "update" | "skip";
  existingName?: string;
}

interface Props {
  preview: ImportPreview[];
  isMasterPasswordEnabled?: boolean;
  onEnableMasterPassword?: () => void;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────

export default function ImportConnectionsModal({
  preview,
  isMasterPasswordEnabled = false,
  onEnableMasterPassword,
  onClose,
}: Props) {
  const t = useT();
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
              {t.modals.importConnections.importComplete}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.modals.importConnections.processed.replace("TOTAL", String(total))}
            </p>
          </div>

          {/* Result stats */}
          <div className="px-5 pb-6 space-y-2">
            {result.added > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Plus size={14} />
                <span>{t.modals.importConnections.added.replace("ITEMS", String(result.added))}</span>
              </div>
            )}
            {result.updated > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <RefreshCw size={14} />
                <span>{t.modals.importConnections.updated.replace("ITEMS", String(result.updated))}</span>
              </div>
            )}
            {result.skipped > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <AlertCircle size={14} />
                <span>{t.modals.importConnections.skipped.replace("ITEMS", String(result.skipped))}</span>
              </div>
            )}
          </div>

          {!isMasterPasswordEnabled && result.added + result.updated > 0 && (
            <div className="mx-5 mb-4 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                {t.modals.importConnections.masterPasswordWarning}
              </p>
              {onEnableMasterPassword && (
                <button
                  onClick={() => { onClose(); onEnableMasterPassword(); }}
                  className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors cursor-pointer"
                >
                  {t.modals.importConnections.enableMasterPassword}
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
              {t.modals.importConnections.done}
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
        <div className="px-5 pt-5 mt-1">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {t.modals.importConnections.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t.modals.importConnections.found.replace("ITEMS", String(preview.length))}
          </p>
        </div>

        {/* Summary badges */}
        <div className="px-5 pb-1 flex items-center gap-3 text-xs mt-2">
          {newCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <Plus size={10} /> {newCount} {t.modals.importConnections.insert.toLowerCase()}
            </span>
          )}
          {updateCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <RefreshCw size={10} /> {updateCount} {t.modals.importConnections.update.toLowerCase()}
            </span>
          )}
          {skipCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <AlertCircle size={10} /> {skipCount} {t.modals.importConnections.skip.toLowerCase()}
            </span>
          )}
        </div>

        {/* Connection list */}
        <div className="px-5 py-3 max-h-60 overflow-y-auto space-y-1.5">
          {preview.map((p) => {
            const badge =
              p.action === "new"
                ? { label: t.modals.importConnections.insert, cls: "border-green-500 text-green-600 dark:text-green-400" }
                : p.action === "update"
                ? { label: t.modals.importConnections.update, cls: "border-amber-500 text-amber-600 dark:text-amber-400" }
                : { label: t.modals.importConnections.skip, cls: "border-gray-400 text-gray-500 dark:text-gray-400" };
            return (
              <div
                key={p.connection.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-700/50 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-gray-800 dark:text-gray-200 truncate block">
                    {p.connection.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {t.providers[p.connection.provider as keyof typeof t.providers]}
                    {p.action === "update" && p.existingName
                      ? (() => {
                          const parts = t.modals.importConnections.replaces.split("{name}");
                          return parts.length === 2
                            ? <>{parts[0]}<strong className="font-semibold">{p.existingName}</strong>{parts[1]}</>
                            : t.modals.importConnections.replaces;
                        })()
                      : p.action === "skip"
                      ? t.modals.importConnections.duplicate
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
            {t.modals.importConnections.cancel}
          </button>
          <button
            onClick={handleImport}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-[var(--s3-accent-active)] text-white hover:bg-[var(--s3-accent-hover)] transition-colors cursor-pointer"
          >
            {t.modals.importConnections.import}
          </button>
        </div>
      </div>
    </div>
  );
}
