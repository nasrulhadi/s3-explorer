import { useT } from "../../i18n";
import type { S3Item } from "../../types";

interface RenameModalProps {
  open: boolean;
  item: S3Item | null;
  name: string;
  loading: boolean;
  error?: string | null;
  onNameChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RenameModal({
  open,
  item,
  name,
  loading,
  error,
  onNameChange,
  onConfirm,
  onCancel,
}: RenameModalProps) {
  const t = useT();
  if (!open || !item) return null;

  const isFolder = item.type === "folder";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {isFolder ? t.modals.rename.titleFolder : t.modals.rename.titleFile}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(() => {
              const parts = t.modals.rename.description.split("{name}");
              return parts.length === 2
                ? <>{parts[0]}<strong>{item.name}</strong>{parts[1]}</>
                : t.modals.rename.description;
            })()}
          </p>
        </div>

        <div className="px-5 pb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !loading) {
                onConfirm();
              }
              if (e.key === "Escape") onCancel();
            }}
            placeholder={t.modals.rename.placeholder}
            autoFocus
            className="
              w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg
              outline-none focus:border-gray-400 dark:focus:border-zinc-500
              bg-zinc-50/50 dark:bg-zinc-900/50 text-gray-800 dark:text-gray-200
              placeholder-gray-300 dark:placeholder-gray-600
            "
          />
        </div>

        {error && (
          <div className="px-5 pb-6">
            <p className="text-xs text-red-500 dark:text-red-400 leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-5 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-zinc-700
              text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-zinc-700
              transition-colors
            "
          >
            {t.modals.rename.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!name.trim() || loading}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-[var(--s3-accent-active)] text-white
              hover:bg-[var(--s3-accent-hover)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {loading ? t.modals.rename.rename : t.modals.rename.rename}
          </button>
        </div>
      </div>
    </div>
  );
}
