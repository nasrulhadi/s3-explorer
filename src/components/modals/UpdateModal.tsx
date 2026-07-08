import { useState } from "react";
import { ArrowUpCircle, Check } from "lucide-react";
import { relaunch } from "@tauri-apps/plugin-process";
import { useUpdateStore } from "../../store/updateStore";

export default function UpdateModal() {
  const update = useUpdateStore((s) => s.update);
  const dismissUpdate = useUpdateStore((s) => s.dismissUpdate);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!update) return null;

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch (e) {
      setError(String(e));
      setInstalling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={installing ? undefined : dismissUpdate}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <ArrowUpCircle size={20} className="text-green-500" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Update Available
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            S3 Explorer <span className="font-medium text-gray-700 dark:text-gray-300">v{update.version}</span> is ready to install.
          </p>
        </div>

        {error && (
          <div className="mx-5 mb-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {installing && (
          <div className="mx-5 mb-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs">
            Downloading and installing...
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-5 pb-6 pt-5">
          <button
            onClick={dismissUpdate}
            disabled={installing}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-40"
          >
            Remind Later
          </button>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            {installing ? (
              <>Installing…</>
            ) : (
              <>
                <Check size={14} />
                Install & Relaunch
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
