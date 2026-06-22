import { useEffect, useRef } from "react";

// While `isOpen`, push a throwaway history entry so the device / browser Back
// button (and the Android back gesture) closes the overlay instead of leaving
// the screen. Closing via the UI removes the entry it added.
//
// Drive this with a single "is any overlay open?" flag (and the close handler
// for whichever one is open) rather than one call per sheet — that keeps a
// single history entry across hand-offs (e.g. editor -> discovery) and avoids
// a popstate race between overlays.
export default function useBackToClose(isOpen, onClose) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let closedByBack = false;
    window.history.pushState({ overlay: true }, "");

    const handlePopState = () => {
      closedByBack = true;
      onCloseRef.current?.();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Closed via the UI rather than Back — drop the entry we pushed so a
      // later Back press doesn't first land on a stale, no-op state.
      if (!closedByBack) {
        window.history.back();
      }
    };
  }, [isOpen]);
}
