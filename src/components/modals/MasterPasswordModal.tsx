import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useT } from "../../i18n";

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

export default function MasterPasswordModal({
  mode,
  externalError,
  isBusy = false,
  onConfirm,
  onCancel,
}: MasterPasswordModalProps) {
  const t = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const needsCurrent = mode === "disable" || mode === "change";
  const needsNew = mode === "enable" || mode === "change";

  const title =
    mode === "enable" ? t.masterPassword.enableProtection :
    mode === "disable" ? t.masterPassword.disableProtection :
    t.masterPassword.changePassword;

  const description =
    mode === "enable" ? t.masterPassword.encryptDescription :
    mode === "disable" ? t.masterPassword.disableDescription :
    t.masterPassword.changeDescription;

  const confirmBtn =
    mode === "enable" ? t.masterPassword.enableProtection :
    mode === "disable" ? t.masterPassword.disableProtection :
    t.masterPassword.changePassword;

  const clearError = () => setError("");

  const handleSubmit = () => {
    setError("");

    if (needsCurrent && !currentPassword) {
      setError(t.masterPassword.currentPasswordRequired);
      return;
    }

    if (needsNew) {
      if (!newPassword) {
        setError(t.masterPassword.newPasswordRequired);
        return;
      }
      if (newPassword.length < 8) {
        setError(t.masterPassword.passwordTooShort);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(t.masterPassword.passwordsDontMatch);
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
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <LockKeyhole size={18} className="text-[var(--s3-accent-text)]" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {title}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="px-5 pb-1 space-y-3">
          {needsCurrent && (
            <PasswordField
              label={t.masterPassword.currentPasswordLabel}
              value={currentPassword}
              show={showCurrent}
              autoFocus
              placeholder={t.masterPassword.enterCurrentPassword}
              onChange={(value) => { setCurrentPassword(value); clearError(); }}
              onToggleShow={() => setShowCurrent((v) => !v)}
              onSubmit={handleSubmit}
            />
          )}

          {needsNew && (
            <>
              <PasswordField
                label={t.masterPassword.newPasswordLabel}
                value={newPassword}
                show={showNew}
                autoFocus={!needsCurrent}
                placeholder={t.masterPassword.chooseStrongPassword}
                onChange={(value) => { setNewPassword(value); clearError(); }}
                onToggleShow={() => setShowNew((v) => !v)}
                onSubmit={handleSubmit}
              />
              <PasswordField
                label={t.masterPassword.confirmPasswordLabel}
                value={confirmPassword}
                show={showConfirm}
                placeholder={t.masterPassword.reEnterPassword}
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
            {t.masterPassword.forgotPasswordWarning}
          </p>
        )}

        <div className="px-5 pt-5 mt-1 pb-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isBusy}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-[var(--s3-accent-active)] text-white hover:bg-[var(--s3-accent-hover)] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isBusy ? t.masterPassword.working : confirmBtn}
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
            border border-gray-300 dark:border-zinc-700 rounded-lg
            bg-zinc-50/50 dark:bg-zinc-900/50
            text-gray-800 dark:text-gray-200
            placeholder-gray-300 dark:placeholder-gray-600
            outline-none focus:border-gray-400 dark:focus:border-zinc-500
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
