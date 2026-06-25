import { useEffect } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Accessibility plumbing for a modal sheet: move focus into the dialog when it
// opens, keep Tab cycling within it (so keyboard / screen-reader users can't
// land on the inert background behind an aria-modal sheet), and restore focus
// to whatever was focused before — the trigger — when it closes. Pass a ref to
// the dialog container, and give that container tabIndex={-1} so it can hold
// focus as a fallback.
export function useDialogFocus(containerRef) {
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Focus the first control inside, falling back to the container itself.
    const first = node.querySelector(FOCUSABLE);
    (first instanceof HTMLElement ? first : node).focus();

    function handleKeyDown(event) {
      if (event.key !== "Tab") return;

      const focusable = node.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && active === lastEl) {
        event.preventDefault();
        firstEl.focus();
      } else if (!node.contains(active)) {
        // Focus escaped the dialog somehow — pull it back in.
        event.preventDefault();
        firstEl.focus();
      }
    }

    node.addEventListener("keydown", handleKeyDown);

    return () => {
      node.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [containerRef]);
}
