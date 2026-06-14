import { useState } from "react";

function SignInScreen({
  onGoogle,
  onEmailSignIn,
  onEmailSignUp,
  onMagicLink,
}) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { tone, message }

  const cleanedEmail = email.trim();

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (busy) return;

    if (!cleanedEmail || !password) {
      setStatus({ tone: "error", message: "Enter your email and password." });
      return;
    }

    setBusy(true);
    setStatus(null);

    const action = mode === "signup" ? onEmailSignUp : onEmailSignIn;
    const { data, error } = (await action(cleanedEmail, password)) || {};

    setBusy(false);

    if (error) {
      setStatus({ tone: "error", message: error.message });
      return;
    }

    // Sign-up with email confirmation returns a user but no active session.
    if (mode === "signup" && !data?.session) {
      setStatus({
        tone: "ok",
        message: "Almost there — check your email to confirm your account.",
      });
    }
    // On success with a session, the auth listener swaps to the app.
  }

  async function handleMagicLink() {
    if (busy) return;

    if (!cleanedEmail) {
      setStatus({ tone: "error", message: "Enter your email first." });
      return;
    }

    setBusy(true);
    setStatus(null);

    const { error } = (await onMagicLink(cleanedEmail)) || {};

    setBusy(false);
    setStatus(
      error
        ? { tone: "error", message: error.message }
        : { tone: "ok", message: `Sign-in link sent to ${cleanedEmail}.` }
    );
  }

  return (
    <main className="app-shell tab-home auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Family meals</p>
        <h1>Weekly meal planner</h1>
        <p className="auth-intro">
          Sign in to plan meals, build your shopping list, and keep everything in
          sync across your devices.
        </p>

        <button type="button" className="primary-button" onClick={onGoogle}>
          Continue with Google
        </button>

        <p className="auth-divider">
          <span>or with email</span>
        </p>

        <form className="auth-form" onSubmit={handlePasswordSubmit}>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit" className="primary-button" disabled={busy}>
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="auth-links">
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setStatus(null);
            }}
          >
            {mode === "signup"
              ? "Have an account? Sign in"
              : "New here? Create an account"}
          </button>

          <button
            type="button"
            className="auth-link"
            onClick={handleMagicLink}
            disabled={busy}
          >
            Email me a sign-in link instead
          </button>
        </div>

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

        <p className="small-text auth-note">
          Your data is private to your account.
        </p>
      </section>
    </main>
  );
}

export default SignInScreen;
