import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface UrlModalProps {
  url: string | null;
  onClose: () => void;
}

export default function UrlModal({ url, onClose }: UrlModalProps) {
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
        className="w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Presigned URL
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This URL expires in 1 hour. Already copied to clipboard.
          </p>
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-mono truncate min-w-0">
              {url}
            </p>
            <button
              onClick={copyUrl}
              className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-[var(--s3-accent-text)] hover:bg-[var(--s3-accent-base)] transition-colors"
              title="Copy URL"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
