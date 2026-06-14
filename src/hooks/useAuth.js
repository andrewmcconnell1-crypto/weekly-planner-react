import { useEffect, useState } from "react";

import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Tracks the signed-in user (or null) and exposes sign-in / sign-out.
// When Supabase isn't configured it stays in a "no auth" state so the app can
// run in local-only mode.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

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
      (_event, session) => {
        setUser(session?.user ?? null);
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

  function signOut() {
    if (!supabase) return undefined;
    return supabase.auth.signOut();
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    signOut,
  };
}
