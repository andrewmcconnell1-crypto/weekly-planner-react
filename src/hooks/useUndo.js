import { useEffect, useRef, useState } from "react";

// Transient "Undo" snackbar for destructive actions. Each action snapshots the
// affected state, mutates, then registers an undo that restores the snapshot.
export function useUndo() {
  const [undoState, setUndoState] = useState(null); // { message, onUndo }
  const undoTimerRef = useRef(null);

  function requestUndo(message, onUndo) {
    window.clearTimeout(undoTimerRef.current);
    setUndoState({ message, onUndo });
    undoTimerRef.current = window.setTimeout(() => setUndoState(null), 6000);
  }

  function runUndo() {
    window.clearTimeout(undoTimerRef.current);
    undoState?.onUndo?.();
    setUndoState(null);
  }

  useEffect(() => () => window.clearTimeout(undoTimerRef.current), []);

  return { undoState, requestUndo, runUndo };
}
