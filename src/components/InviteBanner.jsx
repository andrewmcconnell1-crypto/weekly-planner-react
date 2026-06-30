import { Users, X } from "lucide-react";

// Shown to someone who opened a ?join= invite link and is signed in but not yet
// in a shared household. Routes them to Settings → Household, where the code is
// already prefilled, so joining is one more tap.
function InviteBanner({ onReview, onDismiss }) {
  return (
    <div className="update-banner invite-banner" role="status">
      <span className="update-banner-text">
        <Users size={16} aria-hidden="true" />
        You've been invited to a shared planner.
      </span>

      <button
        type="button"
        className="update-banner-button"
        onClick={onReview}
      >
        Review
      </button>

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

export default InviteBanner;
