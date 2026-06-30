import { useEffect, useState } from "react";

import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Tracks the signed-in user (or null) and exposes sign-in / sign-out.
// When Supabase isn't configured it stays in a "no auth" state so the app can
// run in local-only mode.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  // True after the user follows a password-recovery link, so the app can show
  // the "set a new password" screen instead of the signed-in app (the recovery
  // link establishes a temporary session, so `user` is set at the same time).
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    // When unconfigured, loading already starts false (see useState above).
    if (!isSupabaseConfigured) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  function signInWithGoogle() {
    if (!supabase) return undefined;

    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
  }

  function signInWithEmail(email, password) {
    if (!supabase) return Promise.resolve({ error: null });
    return supabase.auth.signInWithPassword({ email, password });
  }

  function signUpWithEmail(email, password) {
    if (!supabase) return Promise.resolve({ error: null });
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
  }

  function signInWithMagicLink(email) {
    if (!supabase) return Promise.resolve({ error: null });
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
  }

  // Email a password-reset link. The link returns to the app and fires the
  // PASSWORD_RECOVERY event (handled above), which shows the set-password screen.
  function resetPassword(email) {
    if (!supabase) return Promise.resolve({ error: null });
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
  }

  // Set a new password for the (recovery-session) user, then leave recovery mode.
  async function updatePassword(password) {
    if (!supabase) return { error: null };
    const result = await supabase.auth.updateUser({ password });
    if (!result.error) setRecoveryMode(false);
    return result;
  }

  // Re-send the signup confirmation email (for "Email not confirmed" accounts).
  function resendConfirmation(email) {
    if (!supabase) return Promise.resolve({ error: null });
    return supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
  }

  function cancelRecovery() {
    setRecoveryMode(false);
  }

  function signOut() {
    if (!supabase) return undefined;
    return supabase.auth.signOut();
  }

  return {
    user,
    loading,
    recoveryMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    resetPassword,
    updatePassword,
    resendConfirmation,
    cancelRecovery,
    signOut,
  };
}
