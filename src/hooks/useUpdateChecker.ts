import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { useUpdateStore } from "../store/updateStore";

const CHECK_DELAY = 3000;
const CHECK_INTERVAL = 30 * 60 * 1000;

export function useUpdateChecker() {
  const setUpdate = useUpdateStore((s) => s.setUpdate);
  const setChecking = useUpdateStore((s) => s.setChecking);

  useEffect(() => {
    let mounted = true;

    const doCheck = async () => {
      if (!mounted) return;
      setChecking(true);
      try {
        const update = await check();
        if (!mounted) return;
        if (update) {
          setUpdate(update);
        }
      } catch {
        // Silently fail — no internet or no endpoint yet
      } finally {
        if (mounted) setChecking(false);
      }
    };

    const initTimeout = setTimeout(doCheck, CHECK_DELAY);
    const interval = setInterval(doCheck, CHECK_INTERVAL);

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      clearInterval(interval);
    };
  }, [setUpdate, setChecking]);
}
