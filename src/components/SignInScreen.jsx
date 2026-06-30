import { useState } from "react";
import { ArrowRight } from "lucide-react";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function SignInScreen({
  onGoogle,
  onEmailSignIn,
  onEmailSignUp,
  onMagicLink,
  onResetPassword,
  onResendConfirmation,
  onGuest,
}) {
  const [method, setMethod] = useState("password"); // "password" | "link" | "reset"
  const [mode, setMode] = useState("signin"); // password: "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { tone, message }
  // Shown when a sign-in fails because the account's email isn't confirmed yet.
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const cleanedEmail = email.trim();

  function friendlyError(error) {
    const message = error?.message || "Something went wrong. Please try again.";
    if (/rate limit/i.test(message) || error?.status === 429) {
      return "Too many emails were just sent. Wait a few minutes, or sign in with a password instead.";
    }
    if (/email not confirmed/i.test(message)) {
      return "Your email isn't confirmed yet. Check your inbox (and spam) for the confirmation link, or resend it below.";
    }
    if (/invalid login credentials/i.test(message)) {
      return "That email and password don't match. Double-check them, or reset your password below.";
    }
    return message;
  }

  function switchMethod(next) {
    setMethod(next);
    setStatus(null);
    setNeedsConfirm(false);
  }

  async function submitPassword(event) {
    event.preventDefault();
    if (busy) return;

    if (!cleanedEmail || !password) {
      setStatus({ tone: "error", message: "Enter your email and password." });
      return;
    }

    setBusy(true);
    setStatus(null);
    setNeedsConfirm(false);

    const action = mode === "signup" ? onEmailSignUp : onEmailSignIn;
    const { data, error } = (await action(cleanedEmail, password)) || {};

    setBusy(false);

    if (error) {
      if (/email not confirmed/i.test(error?.message || "")) {
        setNeedsConfirm(true);
      }
      setStatus({ tone: "error", message: friendlyError(error) });
      return;
    }

    if (mode === "signup" && !data?.session) {
      setStatus({
        tone: "ok",
        message: "Almost there — check your email to confirm your account.",
      });
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    if (busy) return;

    if (!cleanedEmail) {
      setStatus({ tone: "error", message: "Enter your email." });
      return;
    }

    setBusy(true);
    setStatus(null);

    const { error } = (await onResetPassword(cleanedEmail)) || {};

    setBusy(false);
    setStatus(
      error
        ? { tone: "error", message: friendlyError(error) }
        : {
            tone: "ok",
            message: `Password reset link sent to ${cleanedEmail}. Open it to set a new password.`,
          }
    );
  }

  async function handleResend() {
    if (busy || !cleanedEmail) return;
    setBusy(true);
    const { error } = (await onResendConfirmation(cleanedEmail)) || {};
    setBusy(false);
    setNeedsConfirm(false);
    setStatus(
      error
        ? { tone: "error", message: friendlyError(error) }
        : {
            tone: "ok",
            message: `Confirmation email re-sent to ${cleanedEmail}.`,
          }
    );
  }

  async function submitLink(event) {
    event.preventDefault();
    if (busy) return;

    if (!cleanedEmail) {
      setStatus({ tone: "error", message: "Enter your email." });
      return;
    }

    setBusy(true);
    setStatus(null);

    const { error } = (await onMagicLink(cleanedEmail)) || {};

    setBusy(false);
    setStatus(
      error
        ? { tone: "error", message: friendlyError(error) }
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

        <button type="button" className="auth-google" onClick={onGoogle}>
          <GoogleMark />
          Continue with Google
        </button>

        <p className="auth-divider">
          <span>or with email</span>
        </p>

        {method !== "reset" && (
          <div
            className="auth-methods"
            role="tablist"
            aria-label="Email sign-in"
          >
            <button
              type="button"
              role="tab"
              aria-selected={method === "password"}
              className={method === "password" ? "active" : ""}
              onClick={() => switchMethod("password")}
            >
              Password
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={method === "link"}
              className={method === "link" ? "active" : ""}
              onClick={() => switchMethod("link")}
            >
              Email link
            </button>
          </div>
        )}

        {method === "password" && (
          <form className="auth-form" onSubmit={submitPassword}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button type="submit" className="primary-button" disabled={busy}>
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>

            {mode === "signin" && (
              <button
                type="button"
                className="auth-link"
                onClick={() => switchMethod("reset")}
              >
                Forgot your password?
              </button>
            )}

            {needsConfirm && (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={handleResend}
              >
                Resend confirmation email
              </button>
            )}

            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setStatus(null);
                setNeedsConfirm(false);
              }}
            >
              {mode === "signup"
                ? "Have an account? Sign in"
                : "New here? Create an account"}
            </button>
          </form>
        )}

        {method === "link" && (
          <form className="auth-form" onSubmit={submitLink}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <button type="submit" className="primary-button" disabled={busy}>
              Send sign-in link
            </button>

            <p className="auth-hint">
              We'll email you a link to sign in — no password needed.
            </p>
          </form>
        )}

        {method === "reset" && (
          <form className="auth-form" onSubmit={submitReset}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <button type="submit" className="primary-button" disabled={busy}>
              Send password reset link
            </button>

            <p className="auth-hint">
              We'll email you a link to set a new password.
            </p>

            <button
              type="button"
              className="auth-link"
              onClick={() => switchMethod("password")}
            >
              Back to sign in
            </button>
          </form>
        )}

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

        {onGuest && (
          <button type="button" className="auth-guest" onClick={onGuest}>
            Just looking? Explore without an account
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}

        <p className="small-text auth-note">
          Your data is private to your account.
        </p>
      </section>
    </main>
  );
}

export default SignInScreen;
