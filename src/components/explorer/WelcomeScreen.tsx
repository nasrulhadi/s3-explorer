import { useState, useRef, useCallback } from "react";
import { Plus, Upload } from "lucide-react";
import welcomeScreenImg from "../../assets/welcomeScreen.webp";
import { decryptExport, isEncryptedExport } from "../../lib/crypto";
import { useConnectionStore } from "../../store/connectionStore";
import { useSecurityStore } from "../../store/securityStore";
import ImportConnectionsModal from "../modals/ImportConnectionsModal";
import PassphraseModal from "../modals/PassphraseModal";
import type { S3Connection } from "../../types";

interface WelcomeScreenProps {
  onAddConnection: () => void;
}

const PROVIDERS = ["AWS S3", "Cloudflare R2", "Backblaze B2", "MinIO", "Custom S3"];

/** Shown on first launch when no connections exist */
export default function WelcomeScreen({ onAddConnection }: WelcomeScreenProps) {
  // ── Import state ────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingEncryptedBytesRef = useRef<Uint8Array | null>(null);

  const [importPreview, setImportPreview] = useState<
    { connection: S3Connection; action: "new" | "update" | "skip"; existingName?: string }[] | null
  >(null);
  const [passphraseMode, setPassphraseMode] = useState<"import" | null>(null);
  const [passphraseError, setPassphraseError] = useState("");
  const isMasterPasswordEnabled = useSecurityStore((s) => s.isMasterPasswordEnabled);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".enc") {
      alert("Unsupported file type. Please select an .enc backup file.");
      return;
    }

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
  }, []);

  const handleImportWithPassphrase = useCallback(async (passphrase: string) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ── Render ──────────────────────────────────────────────
  return (
    <main className="flex-1 flex bg-[var(--s3-titlebar-bg)] select-none overflow-hidden">
      {/* Left column - Form area */}
      <div className="w-2/5 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <h2 className="font-bold text-gray-700 mb-10">
            <span className="block text-4xl">Welcome to</span>
            <span className="block text-5xl">S3 Explorer</span>
          </h2>

          <button
            onClick={onAddConnection}
            className="
              w-full inline-flex items-center justify-center gap-2 px-5 py-2.5
              text-sm font-medium text-white bg-[var(--s3-accent-active)] rounded-lg
              hover:bg-[var(--s3-accent-hover)] active:bg-[var(--s3-accent-hover)]
              transition-colors shadow-sm cursor-pointer
            "
          >
            <Plus size={16} />
            Add Your First Connection
          </button>

          {/* ── Divider ── */}
          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600" />
            <span className="text-xs text-gray-300 dark:text-gray-600">Or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600" />
          </div>

          <button
            onClick={handleImportClick}
            className="
              w-full inline-flex items-center justify-center gap-2 px-5 py-2.5
              text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800
              border border-gray-300 dark:border-gray-600 rounded-lg
              hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer
            "
          >
            <Upload size={16} />
            Import Connections
          </button>

          {/* ── Supported providers ── */}
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400">
            {PROVIDERS.map((provider, index) => (
              <span key={provider} className="inline-flex items-center gap-2">
                {index > 0 && <span className="opacity-50">•</span>}
                <span>{provider}</span>
              </span>
            ))}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".enc"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Right column - Hero card */}
      <div className="w-3/5 pt-1 px-6 pb-6">
        <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
          <div className="text-center max-w-md">
            <img
              src={welcomeScreenImg}
              alt=""
              draggable={false}
              className="w-1/2 min-w-[26.5rem] max-w-[40rem] h-auto mx-auto opacity-90 dark:opacity-80 pointer-events-none"
            />
            <p className="mt-6 text-base text-gray-500 leading-relaxed">
              One app, many providers.
              Manage buckets, upload, download, and organize files with a familiar file-browser experience.
            </p>
          </div>
        </div>
      </div>

      {/* ── Import flow modals ── */}
      {importPreview && (
        <ImportConnectionsModal
          preview={importPreview}
          isMasterPasswordEnabled={isMasterPasswordEnabled}
          onClose={() => setImportPreview(null)}
        />
      )}

      {passphraseMode && (
        <PassphraseModal
          mode="import"
          externalError={passphraseError}
          requireMasterPassword={false}
          onConfirm={handleImportWithPassphrase}
          onCancel={() => {
            setPassphraseMode(null);
            setPassphraseError("");
          }}
        />
      )}
    </main>
  );
}
