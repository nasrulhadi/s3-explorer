import { useState, useEffect } from "react";
import { useT } from "../../i18n";

interface NewFolderModalProps {
  open: boolean;
  creating: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function NewFolderModal({
  open,
  creating,
  onConfirm,
  onCancel,
}: NewFolderModalProps) {
  const t = useT();
  const [value, setValue] = useState("");

  // Reset when modal opens
  useEffect(() => { if (open) setValue(""); }, [open]);

  if (!open) return null;

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
            {t.modals.newFolder.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t.modals.newFolder.description}
          </p>
        </div>

        <div className="px-5 pb-6">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim() && !creating) onConfirm(value.trim());
              if (e.key === "Escape") onCancel();
            }}
            disabled={creating}
            placeholder={t.modals.newFolder.placeholder}
            autoFocus
            className="
              w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg
              bg-zinc-50/50 dark:bg-zinc-900/50 text-gray-800 dark:text-gray-200
              placeholder-gray-300 dark:placeholder-gray-600
              outline-none focus:border-gray-400 dark:focus:border-zinc-500
              [&::-ms-reveal]:hidden
            "
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-6">
          <button
            onClick={onCancel}
            disabled={creating}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-zinc-700
              text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-zinc-700
              transition-colors
            "
          >
            {t.modals.newFolder.cancel}
          </button>
          <button
            onClick={() => { if (value.trim()) onConfirm(value.trim()); }}
            disabled={!value.trim() || creating}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-[var(--s3-accent-active)] text-white
              hover:bg-[var(--s3-accent-hover)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {creating ? t.modals.newFolder.creating : t.modals.newFolder.create}
          </button>
        </div>
      </div>
    </div>
  );
}
