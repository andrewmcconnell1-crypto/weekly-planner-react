import { useState } from "react";

// Shown after the user follows a password-reset link (recoveryMode). The
// recovery link already established a session, so we just collect a new password
// and call updateUser. On success the app drops them straight into their plan.
function UpdatePasswordScreen({ onUpdatePassword, onCancel }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { tone, message }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    if (password.length < 6) {
      setStatus({
        tone: "error",
        message: "Use at least 6 characters.",
      });
      return;
    }

    if (password !== confirm) {
      setStatus({ tone: "error", message: "The passwords don't match." });
      return;
    }

    setBusy(true);
    setStatus(null);

    const { error } = (await onUpdatePassword(password)) || {};

    setBusy(false);

    if (error) {
      setStatus({
        tone: "error",
        message: error.message || "Couldn't update your password.",
      });
      return;
    }
    // On success the recovery flag clears and the app renders the plan.
  }

  return (
    <main className="app-shell tab-home auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Family meals</p>
        <h1>Set a new password</h1>
        <p className="auth-intro">
          Choose a new password for your account. You'll be signed in once it's
          saved.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter it"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>

          <button type="submit" className="primary-button" disabled={busy}>
            Save new password
          </button>
        </form>

        {status && (
          <p
            className={`small-text auth-status ${
              status.tone === "error" ? "auth-status-error" : ""
            }`}
            role="status"
          >
            {status.message}
          </p>
        )}

        {onCancel && (
          <button type="button" className="auth-link" onClick={onCancel}>
            Cancel
          </button>
        )}
      </section>
    </main>
  );
}

export default UpdatePasswordScreen;
