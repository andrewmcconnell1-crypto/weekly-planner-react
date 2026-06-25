export default function LoadingScreen({ message }) {
  return (
    <main className="app-shell tab-home auth-shell">
      <section className="auth-card">
        <p className="small-text">{message}</p>
      </section>
    </main>
  );
}
