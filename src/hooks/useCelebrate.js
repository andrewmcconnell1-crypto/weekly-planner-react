import { useEffect, useRef } from "react";

import { celebrate } from "../utils/confetti";

// Fire a confetti burst when `active` flips from false to true (e.g. the moment
// a list becomes complete) — not on mount if it's already true, and not again
// until it has gone false and back.
export function useCelebrate(active) {
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current) celebrate();
    wasActive.current = active;
  }, [active]);
}
