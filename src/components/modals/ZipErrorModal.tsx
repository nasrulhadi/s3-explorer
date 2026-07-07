interface ZipErrorModalProps {
  message: string | null;
  onClose: () => void;
}

export default function ZipErrorModal({ message, onClose }: ZipErrorModalProps) {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-red-600 dark:text-red-400">
            Download Limit Exceeded
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {message}
          </p>
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
