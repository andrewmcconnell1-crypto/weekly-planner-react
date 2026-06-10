function SignInScreen({ onSignIn }) {
  return (
    <main className="app-shell tab-home auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Family meals</p>
        <h1>Weekly meal planner</h1>
        <p className="auth-intro">
          Sign in to plan meals, build your shopping list, and keep everything in
          sync across your devices.
        </p>

        <button type="button" className="primary-button" onClick={onSignIn}>
          Continue with Google
        </button>

        <p className="small-text auth-note">
          Your data is private to your account.
        </p>
      </section>
    </main>
  );
}

export default SignInScreen;
