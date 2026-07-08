import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "../../i18n";

interface UrlModalProps {
  url: string | null;
  onClose: () => void;
}

export default function UrlModal({ url, onClose }: UrlModalProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {t.modals.url.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {t.modals.url.description}
          </p>
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-700/50">
            <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-mono truncate min-w-0">
              {url}
            </p>
            <button
              onClick={copyUrl}
              className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)] transition-colors"
              title={t.modals.url.copyTitle}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end px-5 pb-6 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            {t.modals.url.close}
          </button>
        </div>
      </div>
    </div>
  );
}
