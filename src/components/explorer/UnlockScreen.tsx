import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, LockKeyhole } from "lucide-react";
import unlockScreenImg from "../../assets/unlockScreen.webp";

interface UnlockScreenProps {
  onUnlock: (password: string) => Promise<void>;
  onResetConnections: () => void;
}

export default function UnlockScreen({ onUnlock, onResetConnections }: UnlockScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleUnlock = async () => {
    setError("");
    if (!password) {
      setError("Enter your master password to continue.");
      return;
    }

    setIsUnlocking(true);
    try {
      await onUnlock(password);
    } catch {
      setError("Incorrect master password. Your connections are still locked.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleReset = () => {
    onResetConnections();
  };

  return (
    <main className="flex-1 flex items-center justify-center bg-[var(--s3-window-bg)] px-8 select-none">
      <div className="w-full max-w-md text-center">
        <img
          src={unlockScreenImg}
          alt=""
          draggable={false}
          className="w-96 h-auto mx-auto mb-6 opacity-90 dark:opacity-80 pointer-events-none"
        />

        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
          S3 Explorer is locked
        </h2>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
          Enter your master password to decrypt saved connections on this device.
          Connections stay hidden until the app is unlocked.
        </p>

        <div className="mt-6 text-left">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Master Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter master password"
              autoFocus
              className="
                w-full pl-3 pr-10 py-2.5 text-sm
                border border-gray-300 dark:border-gray-700 rounded-lg
                bg-white dark:bg-gray-900
                text-gray-800 dark:text-gray-200
                placeholder-gray-400 dark:placeholder-gray-500
                outline-none focus:border-[var(--s3-accent-text)] focus:ring-1 focus:ring-[var(--s3-accent-base)]
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
        </div>

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
          {isUnlocking ? "Unlocking…" : "Unlock Connections"}
        </button>

        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="mt-4 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            Forgot master password?
          </button>
        ) : (
          <div className="mt-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Reset saved connections?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-red-600/80 dark:text-red-300/80">
                  This disables the master password and permanently deletes local saved connections.
                  Existing encrypted backup files can still be imported with their backup passphrase.
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Reset & Delete Connections
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
