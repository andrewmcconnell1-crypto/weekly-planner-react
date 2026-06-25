import { Component } from "react";

// Top-level error boundary. A render error anywhere below it would otherwise
// unmount the whole React tree and leave a blank page; instead we catch it and
// show a recoverable card. Note: this only catches errors thrown during
// rendering / lifecycle, not in event handlers or async code (handle those
// where they happen). Class component because React has no hook equivalent.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface the crash — in production the broken subtree is replaced by the
    // fallback, so this console trace is the only record of what happened.
    console.error("App crashed:", error, info?.componentStack);
  }

  handleReset() {
    // Clear the error and re-render the children. Recovers from a transient
    // failure; a deterministic one simply lands back on this card.
    this.setState({ error: null });
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    // A caller can supply a scoped fallback (e.g. a dismissible sheet for a
    // crashed overlay) instead of the default full-screen card — as a node or
    // as a (reset) => node function so it can offer a retry.
    if (this.props.fallback !== undefined) {
      return typeof this.props.fallback === "function"
        ? this.props.fallback(this.handleReset)
        : this.props.fallback;
    }

    return (
      <main className="app-shell tab-home auth-shell">
        <section className="auth-card" role="alert">
          <h1>Something went wrong</h1>
          <p className="small-text">
            The app hit an unexpected error. Your saved data is safe — try
            again, or reload if it keeps happening.
          </p>

          {import.meta.env.DEV && (
            <pre className="error-detail">{String(error?.stack || error)}</pre>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={this.handleReset}
          >
            Try again
          </button>

          <button
            type="button"
            className="secondary"
            onClick={this.handleReload}
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
