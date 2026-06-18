import { useState } from "react";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSettingsStore } from "../store/settingsStore";

interface SettingsPageProps {
  onDone: () => void;
}

export default function SettingsPage({ onDone }: SettingsPageProps) {
  const restoreLastSession = useSettingsStore((s) => s.restoreLastSession);
  const setRestoreLastSession = useSettingsStore((s) => s.setRestoreLastSession);

  // Local state for the form (only save on button click)
  const [localRestore, setLocalRestore] = useState(restoreLastSession);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setRestoreLastSession(localRestore);
    setSaved(true);
    toast.success("Settings saved.");
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={onDone}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">Settings</h2>
      </div>

      {/* ── Scrollable content ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-8 space-y-8">
          {/* ── Startup behavior ─────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Startup Behavior
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Choose what happens when you open S3 Explorer.
            </p>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={localRestore}
                onChange={(e) => {
                  setLocalRestore(e.target.checked);
                  setSaved(false);
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  Restore last session on startup
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  When enabled, the app opens the last viewed bucket and folder.
                  When disabled, the app always starts at the home page.
                </p>
              </div>
            </label>
          </section>

          {/* ── Save button ─────────────────────────────── */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="
                inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg
                bg-blue-500 text-white
                hover:bg-blue-600 active:bg-blue-700
                transition-colors shadow-sm
              "
            >
              {saved ? (
                <CheckCircle2 size={15} />
              ) : (
                <Save size={15} />
              )}
              {saved ? "Saved" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
