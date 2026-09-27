import { useEffect, useRef } from "react";

// Hold a Screen Wake Lock while `active` is true, so the device doesn't dim or
// lock (e.g. mid-cook while following a recipe). The browser auto-releases the
// lock whenever the page is hidden, so we re-acquire it on the next visible.
// Everything is guarded and best-effort: unsupported browsers, or a refusal
// (low battery, permission), simply do nothing — the screen behaves as normal.
export function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return undefined;
    }

    let cancelled = false;

    async function acquire() {
      if (cancelled || lockRef.current) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          lock.release?.().catch(() => {});
          return;
        }
        lockRef.current = lock;
        // Clear our ref if the platform releases it (tab hidden, etc.) so the
        // visibility handler knows to re-acquire.
        lock.addEventListener?.("release", () => {
          lockRef.current = null;
        });
      } catch {
        // Denied or unavailable — leave the screen to its normal behaviour.
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      const lock = lockRef.current;
      lockRef.current = null;
      lock?.release?.().catch(() => {});
    };
  }, [active]);
}
