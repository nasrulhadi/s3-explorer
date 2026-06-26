import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface InfoModalProps {
  data: { title: string; type: string; rows: { label: string; value: string }[] } | null;
  onClose: () => void;
}

export default function InfoModal({ data, onClose }: InfoModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
            {data.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.type} Info</p>
        </div>

        <div className="px-5 pb-2 space-y-1 max-h-72 overflow-y-auto">
          {data.rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">{row.label}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-mono">
                  {row.value}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(row.value, i)}
                className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)] transition-colors"
                title={`Copy ${row.label}`}
              >
                {copiedIndex === i ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end px-5 pb-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer mt-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
