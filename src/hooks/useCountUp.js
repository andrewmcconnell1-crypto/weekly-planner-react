import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Animate a whole number from its previous value to the new one (ease-out),
// so counts like "3 of 7 planned" tick up instead of snapping. Honours
// reduced-motion by jumping straight to the value.
export function useCountUp(value, durationMs = 550) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;

    if (from === to) return undefined;

    cancelAnimationFrame(rafRef.current);

    if (prefersReducedMotion()) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplay(to);
        fromRef.current = to;
      });
      return () => cancelAnimationFrame(rafRef.current);
    }

    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs]);

  return display;
}
