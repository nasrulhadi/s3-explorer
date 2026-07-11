import { X } from "lucide-react";
import { useT } from "../../i18n";

interface ShortcutEntry {
  keys: string[];
  label: string;
}

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  const t = useT();

  if (!open) return null;

  const shortcuts: ShortcutEntry[] = [
    { keys: ["F5", "Ctrl+R"], label: t.shortcuts.refresh },
    { keys: ["Backspace"], label: t.shortcuts.back },
    { keys: ["Ctrl+U"], label: t.shortcuts.upload },
    { keys: ["Delete"], label: t.shortcuts.deleteItems },
    { keys: ["Escape"], label: t.shortcuts.closeOrDeselect },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-sm
          bg-white dark:bg-zinc-800
          border border-gray-200 dark:border-zinc-700
          rounded-2xl shadow-2xl
          mx-4
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-sm font-semibold text-[var(--s3-window-text)]">
            {t.shortcuts.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--s3-window-text)] hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-0.5">
          {shortcuts.map((entry) => (
            <div
              key={entry.label}
              className="flex items-center justify-between py-2"
            >
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {entry.label}
              </span>
              <div className="flex items-center gap-1.5">
                {entry.keys.map((key, i) => (
                  <span key={i}>
                    {i > 0 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mx-0.5">
                        or
                      </span>
                    )}
                    <kbd className="inline-block px-1.5 py-0.5 rounded-md text-[11px] font-mono bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-600">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
