import { useState } from "react";

// The "Account" section: edit your display name and change your password.
// Both go through Supabase updateUser (via the passed handlers); the auth
// listener refreshes `user`, so the avatar and greeting update on save.
function AccountSettings({ user, onUpdateName, onUpdatePassword }) {
  const currentName = String(user?.user_metadata?.full_name || "").trim();

  const [name, setName] = useState(currentName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { tone, message }

  const nameChanged = name.trim() !== currentName;

  async function saveName(event) {
    event.preventDefault();
    if (busy || !nameChanged) return;
    setBusy(true);
    setStatus(null);
    const { error } = (await onUpdateName(name.trim())) || {};
    setBusy(false);
    setStatus(
      error
        ? { tone: "error", message: error.message || "Couldn't save your name." }
        : { tone: "ok", message: "Name updated." }
    );
  }

  async function savePassword(event) {
    event.preventDefault();
    if (busy) return;

    if (password.length < 6) {
      setStatus({ tone: "error", message: "Use at least 6 characters." });
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
    setPassword("");
    setConfirm("");
    setStatus({ tone: "ok", message: "Password updated." });
  }

  return (
    <div className="account-settings">
      <form className="account-block" onSubmit={saveName}>
        <label className="auth-field">
          <span>Display name</span>
          <input
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <p className="small-text">
          Shown on your avatar and in your greeting.
        </p>
        <div className="settings-actions">
          <button
            type="submit"
            className="secondary"
            disabled={busy || !nameChanged}
          >
            Save name
          </button>
        </div>
      </form>

      <form className="account-block account-block-divided" onSubmit={savePassword}>
        <span className="account-block-title">Change password</span>
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
        <div className="settings-actions">
          <button
            type="submit"
            className="secondary"
            disabled={busy || !password}
          >
            Update password
          </button>
        </div>
      </form>

      {status && (
        <p
          className={`small-text settings-status ${
            status.tone === "error" ? "settings-status-error" : ""
          }`}
          role="status"
        >
          {status.message}
        </p>
      )}
    </div>
  );
}

export default AccountSettings;
