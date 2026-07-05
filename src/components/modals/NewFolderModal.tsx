interface NewFolderModalProps {
  open: boolean;
  name: string;
  creating: boolean;
  onNameChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function NewFolderModal({
  open,
  name,
  creating,
  onNameChange,
  onConfirm,
  onCancel,
}: NewFolderModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            New Folder
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter a name for the new folder.
          </p>
        </div>

        <div className="px-5 pb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !creating) {
                onConfirm();
              }
              if (e.key === "Escape") onCancel();
            }}
            placeholder="Folder name"
            autoFocus
            className="
              w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
              outline-none focus:border-[var(--s3-accent-active)] focus:ring-1 focus:ring-[var(--s3-accent-base)]
              bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
              placeholder-gray-300 dark:placeholder-gray-600
              transition-all
            "
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={creating}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!name.trim() || creating}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-[var(--s3-accent-active)] text-white
              hover:bg-[var(--s3-accent-hover)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
