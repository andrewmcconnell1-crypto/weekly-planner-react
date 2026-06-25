// Inline fallback shown when a lazily-loaded panel (a More / Settings section)
// crashes. Keeps the tab bar and the rest of the app alive, and offers a retry.
export default function PanelError({ onRetry }) {
  return (
    <div className="panel-error" role="alert">
      <p className="small-text">This section ran into a problem.</p>

      <button type="button" className="secondary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
