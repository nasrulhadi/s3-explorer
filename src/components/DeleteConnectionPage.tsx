import { useState } from "react";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import type { S3Connection } from "../types";

interface DeleteConnectionPageProps {
  connection: S3Connection;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConnectionPage({
  connection,
  onConfirm,
  onCancel,
}: DeleteConnectionPageProps) {
  const [inputName, setInputName] = useState("");

  const canDelete = inputName.trim() === connection.name;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-[var(--s3-window-border)] bg-[var(--s3-window-bg)] shrink-0 rounded-tl-xl">
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md text-[var(--s3-window-muted)] hover:text-[var(--s3-window-text)] hover:bg-[var(--s3-window-hover-bg)] transition-colors"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-[var(--s3-danger)]">
          Delete Connection
        </h2>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[var(--s3-window-bg)]">
        <div className="max-w-lg mx-auto p-8 space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--s3-danger-light)]">
            <AlertTriangle size={20} className="text-[var(--s3-danger)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--s3-danger)]">
                This action cannot be undone
              </p>
              <p className="text-xs text-[var(--s3-window-muted)] mt-1">
                All credential data for this connection will be permanently deleted,
                including access keys, endpoint, and region settings.
              </p>
            </div>
          </div>

          {/* Connection info */}
          <div className="p-4 rounded-lg border border-[var(--s3-window-border)] bg-[var(--s3-statusbar-bg)]">
            <p className="text-xs text-[var(--s3-window-muted)] uppercase tracking-wider mb-2">
              Connection to delete
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--s3-window-muted)] w-20">Name</span>
                <span className="text-sm font-medium text-[var(--s3-window-text)]">
                  {connection.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--s3-window-muted)] w-20">Provider</span>
                <span className="text-sm text-[var(--s3-window-text)]">
                  {connection.provider.toUpperCase()}
                </span>
              </div>
              {connection.endpoint && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--s3-window-muted)] w-20">Endpoint</span>
                  <span className="text-sm text-[var(--s3-window-muted)] truncate">
                    {connection.endpoint}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--s3-window-muted)] w-20">Region</span>
                <span className="text-sm text-[var(--s3-window-text)]">
                  {connection.region}
                </span>
              </div>
              {connection.defaultBucket && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--s3-window-muted)] w-20">Bucket</span>
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
              Type <strong className="text-[var(--s3-danger)]">{connection.name}</strong> to confirm
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
                bg-[var(--s3-window-bg)] text-[var(--s3-window-text)]
                placeholder-[var(--s3-window-muted)]
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
          <div className="flex items-center gap-3 pt-8">
            <button
              onClick={onCancel}
              className="
                flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                border border-[var(--s3-window-border)] text-[var(--s3-window-muted)]
                hover:bg-[var(--s3-window-hover-bg)] transition-colors
              "
            >
              Cancel
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
              Delete Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
