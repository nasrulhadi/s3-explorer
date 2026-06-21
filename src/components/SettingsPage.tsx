import { ArrowLeft, Mail } from "lucide-react";
import { useSettingsStore, type ThemeMode } from "../store/settingsStore";
import buymeacoffee from "../assets/buymeacoffee.png";

// GitHub icon (inline SVG since it might not be in lucide-react)
function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

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
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--s3-window-bg)]">
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

          {/* ── About ───────────────────────────────────── */}
          <section>
            <div className="rounded-lg bg-[var(--s3-sidebar-bg)] p-6">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                About
              </h3>
              <div className="space-y-4">
                {/* Author info */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Nasrul Hadi</span>
                  </div>
                  <a
                    href="mailto:si.nasrul@gmail.com"
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <Mail size={14} />
                    <span>si.nasrul@gmail.com</span>
                  </a>
                  <a
                    href="https://github.com/nasrulhadi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <GithubIcon size={14} />
                    <span>github.com/nasrulhadi</span>
                  </a>
                </div>

                {/* Buy Me a Coffee */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                    Support this project
                  </p>
                  <a
                    href="https://buymeacoffee.com/nasrulhadi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={buymeacoffee}
                      alt="Buy Me a Coffee"
                      className="h-10 w-auto"
                    />
                  </a>
                </div>

                {/* Version */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    S3 Explorer v1.0.0
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
