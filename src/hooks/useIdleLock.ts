import { useEffect, useRef } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSecurityStore } from "../store/securityStore";

/** User activity events that reset the idle timer. */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
];

/**
 * Auto-lock the secure vault after a period of user inactivity.
 *
 * When a master password is enabled and the vault is unlocked, the vault key
 * lives in memory indefinitely. This hook locks it after `autoLockMinutes` of
 * no user activity, so credentials aren't exposed if the app is left open on
 * an unattended machine.
 *
 * A setting of `0` disables auto-lock.
 */
export function useIdleLock() {
  const autoLockMinutes = useSettingsStore((s) => s.autoLockMinutes);
  const isMasterPasswordEnabled = useSecurityStore((s) => s.isMasterPasswordEnabled);
  const isUnlocked = useSecurityStore((s) => s.isUnlocked);

  // Keep the latest timer handle across renders without re-subscribing listeners.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only arm the timer when there is actually something to lock.
    if (!isMasterPasswordEnabled || !isUnlocked || autoLockMinutes <= 0) {
      return;
    }

    const timeoutMs = autoLockMinutes * 60 * 1000;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Re-check at fire time: only lock if still enabled + unlocked.
        const security = useSecurityStore.getState();
        if (security.isMasterPasswordEnabled && security.isUnlocked) {
          security.lock();
        }
      }, timeoutMs);
    };

    // Start the countdown immediately, then reset on any activity.
    resetTimer();
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, resetTimer);
      }
    };
  }, [autoLockMinutes, isMasterPasswordEnabled, isUnlocked]);
}
