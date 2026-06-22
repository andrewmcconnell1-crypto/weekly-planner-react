import { RotateCcw } from "lucide-react";

// Transient "Undo" snackbar shown after a destructive action. Auto-dismisses on
// a timer owned by the caller; tapping Undo restores the snapshotted state.
function UndoSnackbar({ message, onUndo }) {
  return (
    <div className="undo-snackbar" role="status">
      <span className="undo-snackbar-msg">{message}</span>

      <button
        type="button"
        className="undo-snackbar-action"
        onClick={onUndo}
      >
        <RotateCcw size={15} aria-hidden="true" />
        Undo
      </button>
    </div>
  );
}

export default UndoSnackbar;
