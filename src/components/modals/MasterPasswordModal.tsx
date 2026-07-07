import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export type MasterPasswordMode = "enable" | "disable" | "change";

export interface MasterPasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

interface MasterPasswordModalProps {
  mode: MasterPasswordMode;
  externalError?: string;
  isBusy?: boolean;
  onConfirm: (payload: MasterPasswordPayload) => void;
  onCancel: () => void;
}

const COPY: Record<MasterPasswordMode, { title: string; description: string; confirm: string }> = {
  enable: {
    title: "Enable Master Password",
    description: "Encrypt saved connections and require this password when S3 Explorer starts.",
    confirm: "Enable Protection",
  },
  disable: {
    title: "Disable Master Password",
    description: "Enter your current master password to decrypt and store connections normally again.",
    confirm: "Disable Protection",
  },
  change: {
    title: "Change Master Password",
    description: "Re-encrypt saved connections with a new master password.",
    confirm: "Change Password",
  },
};

export default function MasterPasswordModal({
  mode,
  externalError,
  isBusy = false,
  onConfirm,
  onCancel,
}: MasterPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const needsCurrent = mode === "disable" || mode === "change";
  const needsNew = mode === "enable" || mode === "change";
  const copy = COPY[mode];

  const clearError = () => setError("");

  const handleSubmit = () => {
    setError("");

    if (needsCurrent && !currentPassword) {
      setError("Current master password is required.");
      return;
    }

    if (needsNew) {
      if (!newPassword) {
        setError("New master password is required.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Master password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Master passwords do not match.");
        return;
      }
    }

    onConfirm({
      currentPassword: needsCurrent ? currentPassword : undefined,
      newPassword: needsNew ? newPassword : undefined,
    });
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
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <LockKeyhole size={18} className="text-[var(--s3-accent-text)]" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {copy.title}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {copy.description}
          </p>
        </div>

        <div className="px-5 pb-1 space-y-3">
          {needsCurrent && (
            <PasswordField
              label="Current Master Password"
              value={currentPassword}
              show={showCurrent}
              autoFocus
              placeholder="Enter current password"
              onChange={(value) => { setCurrentPassword(value); clearError(); }}
              onToggleShow={() => setShowCurrent((v) => !v)}
              onSubmit={handleSubmit}
            />
          )}

          {needsNew && (
            <>
              <PasswordField
                label={mode === "enable" ? "Master Password" : "New Master Password"}
                value={newPassword}
                show={showNew}
                autoFocus={!needsCurrent}
                placeholder="Choose a strong password"
                onChange={(value) => { setNewPassword(value); clearError(); }}
                onToggleShow={() => setShowNew((v) => !v)}
                onSubmit={handleSubmit}
              />
              <PasswordField
                label="Confirm Master Password"
                value={confirmPassword}
                show={showConfirm}
                placeholder="Re-enter password"
                onChange={(value) => { setConfirmPassword(value); clearError(); }}
                onToggleShow={() => setShowConfirm((v) => !v)}
                onSubmit={handleSubmit}
              />
            </>
          )}
        </div>

        {(error || externalError) && (
          <p className="px-5 pt-2 text-xs text-red-500 dark:text-red-400">{error || externalError}</p>
        )}

        {mode === "enable" && (
          <p className="px-5 pt-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
            If you forget this password, saved connections cannot be recovered. You can only reset and delete them.
          </p>
        )}

        <div className="px-5 pt-4 pb-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isBusy}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-[var(--s3-accent-active)] text-white hover:bg-[var(--s3-accent-hover)] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isBusy ? "Working…" : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  show,
  placeholder,
  autoFocus = false,
  onChange,
  onToggleShow,
  onSubmit,
}: {
  label: string;
  value: string;
  show: boolean;
  placeholder: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onToggleShow: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="
            w-full pl-3 pr-9 py-2 text-sm
            border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-zinc-800
            text-gray-800 dark:text-gray-200
            placeholder-gray-300 dark:placeholder-gray-600
            outline-none focus:border-zinc-500
            transition-all [&::-ms-reveal]:hidden
          "
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
          title={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
