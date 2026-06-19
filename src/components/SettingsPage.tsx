import { ArrowLeft } from "lucide-react";
import { useSettingsStore, type ThemeMode } from "../store/settingsStore";

interface SettingsPageProps {
  onDone: () => void;
}

// ─── Reusable toggle row ────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 flex-1 pr-4">
        <div className="text-sm text-gray-700 dark:text-gray-200">{label}</div>
        {description && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full
          transition-colors duration-200 ease-in-out
          ${checked ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
            transform transition duration-200 ease-in-out mt-0.5
            ${checked ? "ml-[18px]" : "ml-0.5"}
          `}
        />
      </button>
    </div>
  );
}

// ─── Reusable select row ────────────────────────────────────

function SelectRow({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 flex-1 pr-4">
        <div className="text-sm text-gray-700 dark:text-gray-200">{label}</div>
        {description && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</div>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2.5 py-1.5
          text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 outline-none
          focus:border-blue-500 focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900
          transition-all cursor-pointer
        "
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function SettingsPage({ onDone }: SettingsPageProps) {
  const store = useSettingsStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={onDone}
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
      </div>

      {/* ── Scrollable content ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-8 space-y-8">

          {/* ── General ─────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              General
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <ToggleRow
                label="Restore last session"
                description="Reopen the last viewed bucket and folder on startup"
                checked={store.restoreLastSession}
                onChange={store.setRestoreLastSession}
              />
            </div>
          </section>

          {/* ── Appearance ──────────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Appearance
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <SelectRow
                label="Theme"
                value={store.theme}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                onChange={(v) => store.setTheme(v as ThemeMode)}
              />
            </div>
          </section>

          {/* ── Toolbar ─────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Toolbar
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <ToggleRow
                label="Breadcrumbs"
                description="Show folder path navigation"
                checked={store.showBreadcrumbs}
                onChange={store.setShowBreadcrumbs}
              />
              <ToggleRow
                label="Filter"
                description="Show search/filter input field"
                checked={store.showFilter}
                onChange={store.setShowFilter}
              />
              <ToggleRow
                label="Upload button"
                checked={store.showUpload}
                onChange={store.setShowUpload}
              />
              <ToggleRow
                label="New Folder button"
                checked={store.showNewFolder}
                onChange={store.setShowNewFolder}
              />
              <ToggleRow
                label="Reload button"
                checked={store.showReload}
                onChange={store.setShowReload}
              />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
