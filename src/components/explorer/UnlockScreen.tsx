import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, LockKeyhole } from "lucide-react";
import unlockScreenImg from "../../assets/unlockScreen.webp";
import { useT } from "../../i18n";

interface UnlockScreenProps {
  onUnlock: (password: string) => Promise<void>;
  onResetConnections: () => void;
}

export default function UnlockScreen({ onUnlock, onResetConnections }: UnlockScreenProps) {
  const t = useT();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleUnlock = async () => {
    setError("");
    if (!password) {
      setError(t.unlock.errorEmpty);
      return;
    }

    setIsUnlocking(true);
    try {
      await onUnlock(password);
    } catch {
      setError(t.unlock.errorWrong);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleReset = () => {
    onResetConnections();
  };

  return (
    <main className="flex-1 flex bg-[var(--s3-titlebar-bg)] select-none overflow-hidden">
      {/* Left column - Form */}
      <div className="w-2/5 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-start gap-3 mb-10">
            <h2 className="text-5xl font-bold text-gray-700 dark:text-gray-300">
              {t.unlock.title}
            </h2>
            <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-orange-500 text-orange-500 text-xs font-medium">
              <LockKeyhole size={12} />
              {t.unlock.badge}
            </span>
          </div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            {t.unlock.masterPassword}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder={t.unlock.placeholder}
              autoFocus
              className="
                w-full pl-3 pr-10 py-2.5 text-sm
                border border-gray-300 dark:border-zinc-700 rounded-lg
                bg-white dark:bg-zinc-900
                text-gray-800 dark:text-gray-200
                placeholder-gray-300 dark:placeholder-gray-600
                outline-none focus:border-gray-400 dark:focus:border-zinc-500
                transition-all [&::-ms-reveal]:hidden
              "
              onKeyDown={(e) => { if (e.key === "Enter") void handleUnlock(); }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>}

          <button
            onClick={() => void handleUnlock()}
            disabled={isUnlocking}
            className="
              mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5
              text-sm font-medium text-white bg-[var(--s3-accent-active)] rounded-lg
              hover:bg-[var(--s3-accent-hover)] active:bg-[var(--s3-accent-hover)]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors shadow-sm cursor-pointer
            "
          >
            <LockKeyhole size={16} />
            {isUnlocking ? t.unlock.unlocking : t.unlock.unlockButton}
          </button>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="mt-4 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              {t.unlock.forgotPassword}
            </button>
          ) : (
            <div className="mt-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {t.unlock.resetTitle}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-red-600/80 dark:text-red-300/80">
                    {t.unlock.resetDescription}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                >
                  {t.unlock.cancel}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                >
                  {t.unlock.resetButton}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column - Hero card */}
      <div className="w-3/5 pt-1 px-6 pb-6">
        <div className="w-full h-full bg-white dark:bg-white/5 backdrop-blur-2xl dark:border dark:border-white/7 rounded-2xl flex items-center justify-center">
          <div className="text-center max-w-md">
            <img
              src={unlockScreenImg}
              alt=""
              draggable={false}
              className="w-1/2 min-w-[26.5rem] max-w-[40rem] h-auto mx-auto opacity-90 dark:opacity-80 pointer-events-none"
            />
            <p className="mt-6 text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              Your saved connections are safely encrypted.
              Enter your master password to access them.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
