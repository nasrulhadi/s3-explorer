import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Mail, Download, Upload } from "lucide-react";
import { useSettingsStore, type ThemeMode } from "../store/settingsStore";
import { useConnectionStore } from "../store/connectionStore";
import type { S3Connection } from "../types";
import ImportConnectionsModal from "./modals/ImportConnectionsModal";
import PassphraseModal from "./modals/PassphraseModal";
import { encryptExport, decryptExport, isEncryptedExport } from "../lib/crypto";
import { ACCENT_COLORS } from "../lib/accentColors";
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
          ${checked ? "bg-[var(--s3-accent-active)]" : "bg-gray-300 dark:bg-gray-600"}
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
          focus:border-[var(--s3-accent-active)] focus:ring-1 focus:ring-[var(--s3-accent-base)]
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

// ─── Accent color select with preview ──────────────────────

function AccentColorSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useSettingsStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Listen to system theme changes when theme === "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const isDark = theme === "dark" || (theme === "system" && systemDark);
  const mode = isDark ? "dark" : "light";

  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 flex-1 pr-4">
        <div className="text-sm text-gray-700 dark:text-gray-200">{label}</div>
      </div>
      <div className="flex items-center gap-2">
        {ACCENT_COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => onChange(color.id)}
            title={color.label}
            className={`
              w-6 h-6 rounded-full transition-all
              ${value === color.id ? "ring-2 ring-offset-2 ring-blue-500" : "hover:scale-110"}
            `}
            style={{ backgroundColor: color[mode].base }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function SettingsPage({ onDone }: SettingsPageProps) {
  const store = useSettingsStore();
  const connections = useConnectionStore((s) => s.connections);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import modal state
  const [importPreview, setImportPreview] = useState<
    { connection: S3Connection; action: "new" | "update" | "skip"; existingName?: string }[] | null
  >(null);

  // Passphrase modal state
  const [passphraseMode, setPassphraseMode] = useState<"export" | "import" | null>(null);
  const [passphraseError, setPassphraseError] = useState("");
  const pendingEncryptedBytesRef = useRef<Uint8Array | null>(null);

  // ── Export (encrypted) ──────────────────────────────────
  const handleExportClick = () => {
    setPassphraseMode("export");
  };

  const handleExportWithPassphrase = async (passphrase: string) => {
    setPassphraseError("");
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        connections: connections,
      };
      const encrypted = await encryptExport(data, passphrase);
      const blob = new Blob([encrypted as BlobPart], { type: "application/octet-stream" });

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: "s3-explorer-backup.enc",
          types: [{ description: "Encrypted Backup", accept: { "application/octet-stream": [".enc"] } }],
        }) as FileSystemFileHandle;
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch {
        // Fallback: anchor download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "s3-explorer-backup.enc";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }

      setPassphraseMode(null);
    } catch {
      setPassphraseError("Encryption failed. Please try again.");
    }
  };

  // ── Import ──────────────────────────────────────────────
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    // ── Extension gate ──────────────────────────────────────
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (ext !== ".enc") {
      alert("Unsupported file type. Please select an .enc backup file.");
      return;
    }

    // Encrypted backup → read & check magic, then passphrase
    const reader = new FileReader();
    reader.onerror = () => {
      alert("Failed to read file. It may be locked or corrupted.");
    };
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      if (!isEncryptedExport(bytes)) {
        alert("This file is not a valid S3 Explorer encrypted backup.");
        return;
      }
      pendingEncryptedBytesRef.current = bytes;
      setPassphraseError("");
      setPassphraseMode("import");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportWithPassphrase = async (passphrase: string) => {
    setPassphraseError("");
    const bytes = pendingEncryptedBytesRef.current;
    if (!bytes) return;

    try {
      const raw = await decryptExport(bytes, passphrase);
      pendingEncryptedBytesRef.current = null;
      setPassphraseMode(null);
      processImportData(raw);
    } catch {
      setPassphraseError("Wrong passphrase or corrupted file.");
    }
  };

  /** Shared import processing (used by both plain & encrypted paths) */
  const processImportData = (raw: unknown) => {
    if (!raw || typeof raw !== "object" || !("connections" in raw)) {
      alert("Invalid file: missing 'connections' array.");
      return;
    }

    const arr = (raw as Record<string, unknown>).connections;
    if (!Array.isArray(arr)) {
      alert("Invalid file: 'connections' is not an array.");
      return;
    }

    const imported: S3Connection[] = arr.filter(
      (c: unknown): c is S3Connection =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as S3Connection).id === "string" &&
        typeof (c as S3Connection).name === "string" &&
        typeof (c as S3Connection).provider === "string",
    );

    if (imported.length === 0) {
      alert("No valid connections found in file.");
      return;
    }

    // Build preview: determine action per connection
    const existingConnections = useConnectionStore.getState().connections;
    const preview = imported.map((imp) => {
      const existingById = existingConnections.find((c) => c.id === imp.id);
      if (existingById) {
        return { connection: imp, action: "update" as const, existingName: existingById.name };
      }
      const duplicate = existingConnections.find(
        (c) =>
          c.name === imp.name &&
          c.provider === imp.provider &&
          (c.endpoint ?? "") === (imp.endpoint ?? ""),
      );
      if (duplicate) {
        return { connection: imp, action: "skip" as const };
      }
      return { connection: imp, action: "new" as const };
    });

    setImportPreview(preview);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-gray-200 dark:border-gray-700 bg-[var(--s3-window-bg)] shrink-0 rounded-tl-xl">
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
      <div className="flex-1 overflow-y-auto bg-[var(--s3-window-bg)]">
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
              <AccentColorSelect
                label="Accent Color"
                value={store.accentColor}
                onChange={store.setAccentColor}
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

          {/* ── Data ────────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Data
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="text-sm text-gray-700 dark:text-gray-200">Export Connections</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Save all connections to an encrypted backup file
                  </div>
                </div>
                <button
                  onClick={handleExportClick}
                  disabled={connections.length === 0}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                    border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                >
                  <Download size={14} />
                  Export
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="text-sm text-gray-700 dark:text-gray-200">Import Connections</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Merge connections from an encrypted .enc backup
                  </div>
                </div>
                <button
                  onClick={handleImportClick}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                    border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer
                  "
                >
                  <Upload size={14} />
                  Import
                </button>
              </div>
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

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".enc"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Import confirmation modal */}
      {importPreview && (
        <ImportConnectionsModal
          preview={importPreview}
          onClose={() => setImportPreview(null)}
        />
      )}

      {/* Passphrase modal (export encrypt / import decrypt) */}
      {passphraseMode && (
        <PassphraseModal
          mode={passphraseMode}
          externalError={passphraseError}
          onConfirm={passphraseMode === "export" ? handleExportWithPassphrase : handleImportWithPassphrase}
          onCancel={() => { setPassphraseMode(null); setPassphraseError(""); }}
        />
      )}
    </div>
  );
}
