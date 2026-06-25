import { X } from "lucide-react";

// Fallback shown when a bottom-sheet's contents crash. Rendered as a
// dismissible sheet so the rest of the app stays usable and the user can close
// back to their screen (and reopen to retry).
export default function SheetError({ onClose }) {
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="alertdialog"
        aria-label="Something went wrong"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>Something went wrong</strong>
            <span>This panel ran into a problem</span>
          </div>

          <button
            type="button"
            className="sheet-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="sheet-body">
          <p className="small-text">
            You can close this and keep using the rest of the app. Reopen it to
            try again.
          </p>
        </div>
      </div>
    </div>
  );
}
