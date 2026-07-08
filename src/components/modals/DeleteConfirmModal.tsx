import { useT } from "../../i18n";
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
  const t = useT();
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
        <div className="px-5 pt-5 pb-5">
          <h3 className="text-base font-semibold text-red-600 dark:text-red-400">
            {isBulk
              ? t.modals.deleteConfirm.titleBulk.replace("{count}", String(bulkCount))
              : item!.type === "folder"
              ? t.modals.deleteConfirm.titleFolder
              : t.modals.deleteConfirm.titleFile}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
            {isBulk ? (
              <span>{t.modals.deleteConfirm.confirmBulkText.replace("{count}", String(bulkCount))}</span>
            ) : (
              <>
                {(() => {
                  const parts = t.modals.deleteConfirm.confirmText.split("{name}");
                  return parts.length === 2
                    ? <>{parts[0]}<strong className="font-semibold">{item!.name}</strong>{parts[1]}</>
                    : t.modals.deleteConfirm.confirmText;
                })()}
                {item!.type === "folder" && (
                  <span className="block mt-1">{t.modals.deleteConfirm.folderWarning}</span>
                )}
              </>
            )}
            <span className="block mt-1">{t.modals.deleteConfirm.cannotUndo}</span>
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
            {t.modals.deleteConfirm.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-red-600 hover:bg-red-700 text-white
              transition-colors
            "
          >
            {t.modals.deleteConfirm.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
