import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useT } from "../../i18n";

interface Props {
  mode: "export" | "import";
  externalError?: string;
  requireMasterPassword?: boolean;
  onConfirm: (passphrase: string, masterPassword?: string) => void;
  onCancel: () => void;
}

export default function PassphraseModal({
  mode,
  externalError,
  requireMasterPassword = false,
  onConfirm,
  onCancel,
}: Props) {
  const t = useT();
  const [masterPassword, setMasterPassword] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    if (mode === "export" && requireMasterPassword && !masterPassword) {
      setError("Master password is required to export connections.");
      return;
    }
    if (!pass) {
      setError("Passphrase is required.");
      return;
    }
    if (pass.length < 4) {
      setError("Passphrase must be at least 4 characters.");
      return;
    }
    if (mode === "export" && pass !== confirm) {
      setError("Passphrases do not match.");
      return;
    }

    onConfirm(pass, mode === "export" && requireMasterPassword ? masterPassword : undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-[var(--s3-accent-text)]" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {mode === "export" ? t.modals.passphrase.encryptExport : t.modals.passphrase.decryptImport}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {mode === "export"
              ? requireMasterPassword
                ? t.modals.passphrase.exportDescWithMaster
                : t.modals.passphrase.exportDesc
              : t.modals.passphrase.importDesc}
          </p>
        </div>

        {/* Inputs */}
        <div className="px-5 pb-1 space-y-3">
          {mode === "export" && requireMasterPassword && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t.modals.passphrase.masterPasswordLabel}
              </label>
              <div className="relative">
                <input
                  type={showMasterPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => { setMasterPassword(e.target.value); setError(""); }}
                  placeholder={t.unlock.placeholder}
                  autoFocus
                  className="
                    w-full pl-3 pr-9 py-2 text-sm
                    border border-gray-300 dark:border-zinc-700 rounded-lg
                    bg-white dark:bg-zinc-900/50
                    text-gray-800 dark:text-gray-200
                    placeholder-gray-300 dark:placeholder-gray-600
                    outline-none focus:border-zinc-500
                    transition-all
                    [&::-ms-reveal]:hidden
                  "
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                />
                <button
                  type="button"
                  onClick={() => setShowMasterPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  title={showMasterPassword ? "Hide" : "Show"}
                >
                  {showMasterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Passphrase */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t.modals.passphrase.passphraseLabel}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(""); }}
                placeholder={mode === "export" ? "Choose a strong passphrase" : "Enter passphrase"}
                autoFocus={!(mode === "export" && requireMasterPassword)}
                className="
                  w-full pl-3 pr-9 py-2 text-sm
                  border border-gray-300 dark:border-zinc-700 rounded-lg
                bg-zinc-50/50 dark:bg-zinc-900/50
                  text-gray-800 dark:text-gray-200
                  placeholder-gray-300 dark:placeholder-gray-600
                  outline-none focus:border-gray-400 dark:focus:border-zinc-500
                  transition-all
                  [&::-ms-reveal]:hidden
                "
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                title={showPass ? "Hide" : "Show"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm passphrase (export only) */}
          {mode === "export" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t.modals.passphrase.confirmLabel}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder={t.modals.passphrase.confirmPlaceholder}
                  className="
                    w-full pl-3 pr-9 py-2 text-sm
                    border border-gray-300 dark:border-zinc-700 rounded-lg
                    bg-zinc-50/50 dark:bg-zinc-900/50
                    text-gray-800 dark:text-gray-200
                    placeholder-gray-300 dark:placeholder-gray-600
                    outline-none focus:border-gray-400 dark:focus:border-zinc-500
                    transition-all
                    [&::-ms-reveal]:hidden
                  "
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  title={showConfirm ? "Hide" : "Show"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {(error || externalError) && (
          <p className="px-5 pt-2 text-xs text-red-500 dark:text-red-400">{error || externalError}</p>
        )}

        {/* Footer */}
        <div className="px-5 pt-5 mt-1 pb-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            {t.modals.passphrase.cancel}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-[var(--s3-accent-active)] text-white hover:bg-[var(--s3-accent-hover)] transition-colors cursor-pointer"
          >
            {mode === "export" ? t.modals.passphrase.encryptSave : t.modals.passphrase.decryptContinue}
          </button>
        </div>
      </div>
    </div>
  );
}
