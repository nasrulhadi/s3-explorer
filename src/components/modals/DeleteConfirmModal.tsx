import type { S3Item } from "../../types";

interface DeleteConfirmModalProps {
  open: boolean;
  item: S3Item | null;
  bulkCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  open,
  item,
  bulkCount,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!open) return null;
  const isBulk = bulkCount && bulkCount > 0 && !item;
  if (!isBulk && !item) return null;

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
          <h3 className="text-base font-semibold text-red-600 dark:text-red-400">
            {isBulk ? `Delete ${bulkCount} Items` : `Delete ${item!.type === "folder" ? "Folder" : "File"}`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
            {isBulk ? (
              <span>Are you sure you want to delete <strong>{bulkCount} items</strong>?</span>
            ) : (
              <>
                Are you sure you want to delete <strong>{item!.name}</strong>?
                {item!.type === "folder" && (
                  <span className="block mt-1">All contents inside will be permanently removed.</span>
                )}
              </>
            )}
            <span className="block mt-1">This action cannot be undone.</span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-zinc-700
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-red-600 hover:bg-red-700 text-white
              transition-colors
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
