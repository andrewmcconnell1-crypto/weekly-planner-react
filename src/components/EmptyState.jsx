// A friendly empty state: an icon tile above a short heading and a line of copy.
// Shared across the shopping list, stock and recurring-buys screens so first-run
// states look consistent. `tone="done"` fills the icon (a positive, finished
// state) rather than the default soft tint.
function EmptyState({ icon: Icon, title, tone = "default", children }) {
  return (
    <div className={`empty-block ${tone === "done" ? "empty-block-done" : ""}`}>
      <span className="empty-block-icon" aria-hidden="true">
        <Icon size={26} />
      </span>
      <strong className="empty-block-title">{title}</strong>
      {children && <p className="empty-block-text">{children}</p>}
    </div>
  );
}

export default EmptyState;
