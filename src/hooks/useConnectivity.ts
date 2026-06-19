import { useState, useEffect } from "react";

const CHECK_URL = "https://1.1.1.1/cdn-cgi/trace";
const CHECK_INTERVAL = 60000; // 1 minute

/**
 * Custom hook to check internet connectivity by pinging a reliable endpoint.
 * Falls back to navigator.onLine if ping fails.
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    let mounted = true;

    const checkConnectivity = async () => {
      try {
        // Use HEAD request for minimal data transfer
        await fetch(CHECK_URL, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
        });
        if (mounted) {
          setIsOnline((prev) => (prev === true ? prev : true));
        }
      } catch {
        // If ping fails, check navigator.onLine as fallback
        if (mounted) {
          const online = navigator.onLine;
          setIsOnline((prev) => (prev === online ? prev : online));
        }
      }
    };

    // Initial check
    checkConnectivity();

    // Periodic check every 30 seconds
    const intervalId = setInterval(checkConnectivity, CHECK_INTERVAL);

    // Also listen to browser online/offline events for immediate feedback
    const handleOnline = () => setIsOnline((prev) => (prev === true ? prev : true));
    const handleOffline = () => setIsOnline((prev) => (prev === false ? prev : false));
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
