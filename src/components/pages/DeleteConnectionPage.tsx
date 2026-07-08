import { useState } from "react";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { useT } from "../../i18n";
import type { S3Connection } from "../../types";

export default function DeleteConnectionPage({
  connection,
  onConfirm,
  onCancel,
}: {
  connection: S3Connection;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [inputName, setInputName] = useState("");

  const canDelete = inputName.trim() === connection.name;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-[var(--s3-window-border)] bg-[var(--s3-window-bg)] shrink-0">
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md text-[var(--s3-window-muted)] hover:text-[var(--s3-window-text)] hover:bg-[var(--s3-window-hover-bg)] transition-colors"
          title={t.common.back}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-[var(--s3-danger)]">
          {t.deletePage.pageTitle}
        </h2>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[var(--s3-window-bg)]">
        <div className="max-w-xl mx-auto p-8 space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--s3-danger-light)]">
            <AlertTriangle size={20} className="text-[var(--s3-danger)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--s3-danger)]">
                {t.deletePage.warning}
              </p>
              <p className="text-xs text-[var(--s3-window-muted)] mt-1">
                {t.deletePage.warningDesc}
              </p>
            </div>
          </div>

          {/* Connection info */}
          <div className="p-4 rounded-lg border border-[var(--s3-window-border)] bg-[var(--s3-statusbar-bg)]">
            <p className="text-xs text-[var(--s3-window-muted)] uppercase tracking-wider mb-2">
              {t.deletePage.connectionToDelete}
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--s3-window-muted)] w-20">{t.common.name}</span>
                <span className="text-sm font-medium text-[var(--s3-window-text)]">
                  {connection.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--s3-window-muted)] w-20">{t.common.provider}</span>
                <span className="text-sm text-[var(--s3-window-text)]">
                  {t.providers[connection.provider]}
                </span>
              </div>
              {connection.endpoint && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--s3-window-muted)] w-20">{t.common.endpoint}</span>
                  <span className="text-sm text-[var(--s3-window-text)]" title={connection.endpoint}>
                    {connection.endpoint.length > 50
                      ? connection.endpoint.slice(0, 50) + "..."
                      : connection.endpoint}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--s3-window-muted)] w-20">{t.common.region}</span>
                <span className="text-sm text-[var(--s3-window-text)]">
                  {connection.region}
                </span>
              </div>
              {connection.defaultBucket && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--s3-window-muted)] w-20">{t.common.bucket}</span>
                  <span className="text-sm text-[var(--s3-window-text)]">
                    {connection.defaultBucket}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Confirm input */}
          <div>
            <label className="block text-sm font-medium text-[var(--s3-window-text)] mb-1.5">
              {t.deletePage.confirmPrompt.replace("NAME", connection.name)}
            </label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder={connection.name}
              className="
                w-full px-3 py-2.5 text-sm
                border border-[var(--s3-window-border)] rounded-lg
                outline-none focus:border-[var(--s3-danger)] focus:ring-1 focus:ring-[var(--s3-danger-light)]
                bg-zinc-50/20 text-[var(--s3-window-text)] dark:bg-zinc-800/30
                placeholder-[var(--s3-window-muted)] placeholder:opacity-60
                transition-all
              "
              onKeyDown={(e) => {
                if (e.key === "Enter" && canDelete) {
                  onConfirm();
                }
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-5">
            <button
              onClick={onCancel}
              className="
                flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                border border-[var(--s3-window-border)] text-[var(--s3-window-muted)]
                hover:bg-[var(--s3-window-hover-bg)] transition-colors
              "
            >
              {t.common.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={!canDelete}
              className="
                flex-1 inline-flex items-center justify-center gap-2
                px-4 py-2.5 text-sm font-medium rounded-lg
                bg-[var(--s3-danger)] text-white
                hover:bg-red-600 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Trash2 size={15} />
              {t.deletePage.deleteButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
