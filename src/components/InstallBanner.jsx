import { Download, Share, X } from "lucide-react";

// A gentle prompt to install the app to the home screen. On Android/desktop the
// button fires the browser's native install dialog; on iOS Safari (which has no
// such API) it just spells out the Share -> Add to Home Screen steps.
function InstallBanner({ mode, onInstall, onDismiss }) {
  return (
    <div className="update-banner install-banner" role="status">
      {mode === "prompt" ? (
        <>
          <span className="update-banner-text">
            <Download size={16} aria-hidden="true" />
            Install this app
          </span>
          <button
            type="button"
            className="update-banner-button"
            onClick={onInstall}
          >
            Install
          </button>
        </>
      ) : (
        <span className="update-banner-text install-banner-hint">
          <Share size={16} aria-hidden="true" />
          To install: tap Share, then <strong>Add to Home Screen</strong>
        </span>
      )}

      <button
        type="button"
        className="invite-banner-dismiss"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export default InstallBanner;
