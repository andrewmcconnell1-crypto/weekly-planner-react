import { useEffect, useState } from "react";

// Is the app already running as an installed PWA (standalone window)?
function standaloneNow() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    window.navigator?.standalone === true
  );
}

// iPhone/iPad, including iPadOS 13+ which reports itself as a desktop Mac.
function detectIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
}

// Real Safari, not Chrome/Firefox/Edge on iOS (all WebKit, but only Safari can
// "Add to Home Screen").
function detectIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return detectIOS() && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

// Surfaces whether we can offer to install the app, and how. On Chromium
// (Android/desktop) we capture the browser's beforeinstallprompt event and can
// trigger the native install dialog. iOS Safari blocks that API, so there we can
// only point the user at Share -> Add to Home Screen.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstall(event) {
      // Stop Chrome's mini-infobar; we surface our own affordance instead.
      event.preventDefault();
      setDeferredPrompt(event);
    }
    function onInstalled() {
      setDeferredPrompt(null);
      setInstalled(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => null);
    // A prompt can only be used once; drop it whatever the outcome.
    setDeferredPrompt(null);
    return choice?.outcome === "accepted";
  }

  return {
    canPromptInstall: Boolean(deferredPrompt),
    isIOS: detectIOS(),
    isIOSSafari: detectIOSSafari(),
    isStandalone: installed || standaloneNow(),
    promptInstall,
  };
}
